import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Hono } from "hono";
import { Miniflare } from "miniflare";
import { z } from "zod";

import { type AppDatabase, createDatabase, runWithDatabase } from "#/lib/database/database.server";
import messages from "#/lib/server/routes/messages";

const miniflare = new Miniflare({
  workers: [
    {
      config: {
        name: "messages-access-test",
        compatibilityDate: "2026-10-01",
        manifest: {
          mainModule: "index.js",
          modules: {
            "index.js": {
              type: "esm",
              contents: `
            export class Messenger {
              async fetch(request) {
                return Response.json({ userId: request.headers.get('X-Initiate-User-Id'), roomId: request.headers.get('X-Initiate-Room-Id') });
              }
            }
            export default { fetch: () => new Response('ok') };
          `,
            },
          },
        },
        exports: { Messenger: { type: "durable-object", storage: "sqlite" } },
        env: {
          DB: { type: "d1", id: "messages-access-test" },
          MESSENGER: { type: "durable-object", worker: "messages-access-test", exportName: "Messenger" },
        },
      },
    },
  ],
});
let bindings: Env;
let database: AppDatabase;
const app = new Hono<{ Bindings: Env }>();
app.use("*", async (context, next) => {
  context.set("auth", { userId: context.req.header("X-Test-User") ?? null, orgId: null });
  await next();
});
app.route("/messages", messages);

function request(userId: string | null, path: string, method = "GET", body?: unknown, origin?: string, spoof = false) {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (userId) headers.set("X-Test-User", userId);
  if (origin) headers.set("Origin", origin);
  if (spoof) {
    headers.set("X-Initiate-User-Id", "stranger");
    headers.set("X-Initiate-Room-Id", "other-room");
  }
  return runWithDatabase(database, undefined, () =>
    app.request(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) }, bindings),
  );
}

beforeAll(async () => {
  bindings = await miniflare.getBindings<Env>();
  database = createDatabase(bindings.DB);
  const migrations = join(import.meta.dir, "../migrations");
  for (const name of readdirSync(migrations).sort()) {
    const sql = readFileSync(join(migrations, name, "migration.sql"), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await bindings.DB.prepare(statement).run();
    }
  }
  await bindings.DB.prepare(
    "INSERT INTO users (id, firstName, type) VALUES ('alice', 'Alice', 'user'), ('bob', 'Bob', 'user'), ('provider', 'Provider', 'user'), ('stranger', 'Stranger', 'user')",
  ).run();
  await bindings.DB.prepare("INSERT INTO organizations (id, name) VALUES ('provider-org', 'Provider')").run();
  await bindings.DB.prepare(
    "INSERT INTO auth_members (id, organizationId, userId) VALUES ('member', 'provider-org', 'provider')",
  ).run();
  await bindings.DB.prepare("INSERT INTO communication_rooms (id) VALUES ('existing-room')").run();
  await bindings.DB.prepare("INSERT INTO user_participants (roomId, userId) VALUES ('existing-room', 'bob')").run();
  await bindings.DB.prepare(
    "INSERT INTO organization_participants (roomId, organizationId) VALUES ('existing-room', 'provider-org')",
  ).run();
});

afterAll(async () => miniflare.dispose());

describe("message room access", () => {
  test("only the user or a provider member can create their conversation", async () => {
    const payload = { userId: "alice", organizationId: "provider-org" };
    expect((await request("stranger", "/messages/rooms", "POST", payload)).status).toBe(403);
    const response = await request("alice", "/messages/rooms", "POST", { ...payload, userId: "current" });
    expect(response.status).toBe(200);
    const roomId = z.object({ id: z.string() }).parse(await response.json()).id;
    expect(roomId).not.toBe("existing-room");
    const providerResponse = await request("provider", "/messages/rooms", "POST", payload);
    expect(providerResponse.status).toBe(200);
    expect(z.object({ id: z.string() }).parse(await providerResponse.json()).id).toBe(roomId);
  });

  test("rejects unauthenticated, cross-origin, and unrelated WebSocket clients", async () => {
    const path = "/messages/rooms/existing-room/connect";
    expect((await request(null, path, "GET", undefined, "http://localhost")).status).toBe(401);
    expect((await request("alice", path, "GET", undefined, "https://attacker.example")).status).toBe(403);
    expect((await request("stranger", path, "GET", undefined, "http://localhost")).status).toBe(403);
  });

  test("forwards only the authenticated user and authorized room to the durable object", async () => {
    const response = await request(
      "provider",
      "/messages/rooms/existing-room/connect",
      "GET",
      undefined,
      "http://localhost",
      true,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ userId: "provider", roomId: "existing-room" });
  });
});
