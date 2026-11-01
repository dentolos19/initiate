import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";

import { drizzle } from "drizzle-orm/bun-sqlite";

import { message } from "#/lib/database/schema";
import { ownedMessage } from "#/lib/server/lib/owned-message";
import { canAccessRoom, isSameOrigin } from "#/lib/server/lib/room-access";

describe("room access", () => {
  const room = { users: [{ userId: "alice" }], organizations: [{ organizationId: "org" }] };
  const isMember = async (userId: string, organizationId: string) => userId === "bob" && organizationId === "org";

  test("allows direct participants and members of participating organizations", async () => {
    expect(await canAccessRoom(room, "alice", isMember)).toBe(true);
    expect(await canAccessRoom(room, "bob", isMember)).toBe(true);
  });

  test("rejects users outside the room", async () => {
    expect(await canAccessRoom(room, "mallory", isMember)).toBe(false);
  });

  test("accepts only same-origin WebSocket connections", () => {
    expect(isSameOrigin("https://initiate.example", "https://initiate.example/api/messages/rooms/room/connect")).toBe(
      true,
    );
    expect(isSameOrigin("https://attacker.example", "https://initiate.example/api/messages/rooms/room/connect")).toBe(
      false,
    );
    expect(isSameOrigin(undefined, "https://initiate.example/api/messages/rooms/room/connect")).toBe(false);
  });
});

test("message changes are limited to the sender and room", async () => {
  const sqlite = new Database(":memory:");
  sqlite.exec('CREATE TABLE communication_messages (id TEXT PRIMARY KEY, "roomId" TEXT, "userId" TEXT, content TEXT)');
  sqlite.exec("INSERT INTO communication_messages VALUES ('message', 'room', 'alice', 'original')");
  const database = drizzle({ client: sqlite });

  await database
    .update(message)
    .set({ content: "spoofed" })
    .where(ownedMessage("message", "room", "mallory"));
  await database
    .update(message)
    .set({ content: "wrong room" })
    .where(ownedMessage("message", "other", "alice"));
  expect(sqlite.query<{ content: string }, []>("SELECT content FROM communication_messages").get()?.content).toBe(
    "original",
  );

  await database
    .update(message)
    .set({ content: "edited" })
    .where(ownedMessage("message", "room", "alice"));
  expect(sqlite.query<{ content: string }, []>("SELECT content FROM communication_messages").get()?.content).toBe(
    "edited",
  );
  sqlite.close();
});
