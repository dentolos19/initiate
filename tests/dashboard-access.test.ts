import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Hono } from "hono";
import { Miniflare } from "miniflare";

import { type AppDatabase, createDatabase, runWithDatabase } from "#/lib/database/database.server";
import dashboard from "#/lib/server/routes/dashboard";

const miniflare = new Miniflare({
  workers: [
    {
      config: {
        name: "dashboard-access-test",
        compatibilityDate: "2026-10-01",
        manifest: {
          mainModule: "index.js",
          modules: { "index.js": { type: "esm", contents: "export default { fetch: () => new Response('ok') }" } },
        },
        env: { DB: { type: "d1", id: "dashboard-access-test" } },
      },
    },
  ],
});
let bindings: Env;
let database: AppDatabase;
const app = new Hono<{ Bindings: Env }>();
app.use("*", async (context, next) => {
  context.set("auth", {
    userId: context.req.header("X-Test-User") ?? null,
    orgId: context.req.header("X-Test-Org") ?? null,
  });
  await next();
});
app.route("/dashboard", dashboard);

function request(userId: string | null, organizationId: string | null, path: string) {
  const headers = new Headers();
  if (userId) headers.set("X-Test-User", userId);
  if (organizationId) headers.set("X-Test-Org", organizationId);
  return runWithDatabase(database, undefined, () => app.request(path, { headers }, bindings));
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
    "INSERT INTO users (id, firstName, type) VALUES ('member', 'Member', 'user'), ('stranger', 'Stranger', 'user'), ('admin', 'Admin', 'admin')",
  ).run();
  await bindings.DB.prepare("INSERT INTO organizations (id, name) VALUES ('org', 'Organization')").run();
  await bindings.DB.prepare(
    "INSERT INTO auth_members (id, organizationId, userId) VALUES ('membership', 'org', 'member')",
  ).run();
});
afterAll(async () => miniflare.dispose());

describe("dashboard access", () => {
  test("never falls back to global financial data without organization membership", async () => {
    for (const path of [
      "/dashboard/metrics",
      "/dashboard/charts/revenue",
      "/dashboard/services/top",
      "/dashboard/transactions/recent",
      "/dashboard/insights",
    ]) {
      expect((await request(null, "org", path)).status).toBe(401);
      expect((await request("member", null, path)).status).toBe(403);
      expect((await request("stranger", "org", path)).status).toBe(403);
    }
  });

  test("allows members to see their organization and reserves global signups for admins", async () => {
    for (const path of [
      "/dashboard/metrics",
      "/dashboard/charts/revenue",
      "/dashboard/services/top",
      "/dashboard/transactions/recent",
    ]) {
      expect((await request("member", "org", path)).status).toBe(200);
    }
    expect((await request("member", "org", "/dashboard/charts/signups")).status).toBe(403);
    expect((await request("admin", null, "/dashboard/charts/signups")).status).toBe(200);
  });
});
