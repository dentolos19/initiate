import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";

test("Better Auth migration preserves account credentials while removing the obsolete issuer constraint", async () => {
  const db = new Database(":memory:");
  db.exec(`CREATE TABLE auth_accounts (id TEXT PRIMARY KEY, issuer TEXT NOT NULL, accountId TEXT NOT NULL, providerId TEXT NOT NULL, userId TEXT NOT NULL, password TEXT);
    CREATE UNIQUE INDEX auth_accounts_issuer_accountId_key ON auth_accounts (issuer, accountId);
    INSERT INTO auth_accounts VALUES ('old', 'credential', 'user-1', 'credential', 'user-1', 'password-hash');`);
  const migration = await Bun.file(
    new URL("../migrations/20261015002054_better_auth_provider_identity/migration.sql", import.meta.url),
  ).text();
  db.exec(migration.replaceAll("--> statement-breakpoint", ""));
  expect(db.query("SELECT * FROM auth_accounts WHERE id = 'old'").get()).toEqual({
    id: "old",
    accountId: "user-1",
    providerId: "credential",
    userId: "user-1",
    password: "password-hash",
  });
  db.exec(
    "INSERT INTO auth_accounts (id, accountId, providerId, userId) VALUES ('new', 'user-2', 'credential', 'user-2')",
  );
  expect(db.query("SELECT count(*) AS count FROM auth_accounts").get().count).toBe(2);
  db.close();
});
