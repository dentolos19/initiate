import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Hono } from "hono";
import { Miniflare } from "miniflare";

import { createDatabase, runWithDatabase, type AppDatabase } from "#/lib/database/database.server";
import orderInvoices from "#/lib/server/routes/order-invoices";

const miniflare = new Miniflare({
  workers: [{
    config: {
      name: "invoice-state-test",
      compatibilityDate: "2026-10-01",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { fetch: () => new Response('ok') }" } },
      },
      env: { DB: { type: "d1", id: "invoice-state-test" } },
    },
  }],
});
let bindings: Env;
let database: AppDatabase;
let racedDatabase: AppDatabase;
let changedStatus: string | undefined;
const app = new Hono<{ Bindings: Env }>();
app.use("*", async (context, next) => {
  context.set("auth", { userId: "provider", orgId: "provider-org" });
  await next();
});
app.route("/orders", orderInvoices);

function request(path: string, method: string, body?: unknown, raceStatus?: string) {
  changedStatus = raceStatus;
  return runWithDatabase(raceStatus ? racedDatabase : database, undefined, () =>
    app.request(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    }, bindings),
  );
}

beforeAll(async () => {
  bindings = await miniflare.getBindings<Env>();
  database = createDatabase(bindings.DB);

  // Change the invoice after its initial SELECT returns but before the handler writes it.
  const racingBinding = new Proxy(bindings.DB, {
    get(target, property) {
      if (property !== "prepare") return Reflect.get(target, property, target);
      return (sql: string) => {
        const statement = target.prepare(sql);
        if (!sql.trimStart().toLowerCase().startsWith("select") || !sql.includes('"service_invoices"')) return statement;
        return new Proxy(statement, {
          get(statementTarget, key) {
            if (key !== "bind") return Reflect.get(statementTarget, key, statementTarget);
            return (...parameters: unknown[]) => {
              const bound = statementTarget.bind(...parameters);
              return new Proxy(bound, {
                get(boundTarget, boundKey) {
                  if (boundKey !== "raw") return Reflect.get(boundTarget, boundKey, boundTarget);
                  return async () => {
                    const result = await boundTarget.raw();
                    if (changedStatus) {
                      const status = changedStatus;
                      changedStatus = undefined;
                      const statements = [
                        bindings.DB.prepare("UPDATE service_invoices SET status = ? WHERE id = 'invoice'").bind(status),
                      ];
                      if (status === "paid") {
                        statements.push(
                          bindings.DB.prepare(`INSERT OR IGNORE INTO payment_intents
                            (id, invoiceId, paymentAccountId, customerReference, amount, currency, status)
                            VALUES ('intent', 'invoice', 'account', 'customer', 10000, 'sgd', 'succeeded')`),
                          bindings.DB.prepare(`INSERT OR IGNORE INTO payment_charges
                            (id, paymentIntentId, invoiceId, amount, currency, status, refundedAmount)
                            VALUES ('charge', 'intent', 'invoice', 10000, 'sgd', 'succeeded', 0)`),
                          bindings.DB.prepare(`INSERT OR IGNORE INTO payment_balance_transactions
                            (id, paymentAccountId, sourceId, type, amount, currency)
                            VALUES ('balance', 'account', 'charge', 'charge', 10000, 'sgd')`),
                        );
                      }
                      await bindings.DB.batch(statements);
                    }
                    return result;
                  };
                },
              });
            };
          },
        });
      };
    },
  });
  racedDatabase = createDatabase(racingBinding);

  const migrations = join(import.meta.dir, "../migrations");
  for (const name of readdirSync(migrations).sort()) {
    const sql = readFileSync(join(migrations, name, "migration.sql"), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await bindings.DB.prepare(statement).run();
    }
  }
  await bindings.DB.batch([
    bindings.DB.prepare("INSERT INTO users (id, firstName) VALUES ('buyer', 'Buyer'), ('provider', 'Provider')"),
    bindings.DB.prepare("INSERT INTO organizations (id, name) VALUES ('provider-org', 'Provider')"),
    bindings.DB.prepare("INSERT INTO auth_members (id, organizationId, userId) VALUES ('member', 'provider-org', 'provider')"),
    bindings.DB.prepare("INSERT INTO service_orders (id, userId, organizationId, name) VALUES ('order', 'buyer', 'provider-org', 'Order')"),
    bindings.DB.prepare(`INSERT INTO service_invoices (id, orderId, userId, amount, status, paymentAccountId, customerReference, reference)
      VALUES ('invoice', 'order', 'buyer', 10000, 'draft', 'account', 'customer', 'reference')`),
  ]);
});
afterAll(async () => miniflare.dispose());

describe("invoice state changes", () => {
  test("rejects stale edits, finalizations, and removals after the invoice changes", async () => {
    const cases: Array<{ initial: string; changed: string; method: string; path: string; body?: unknown }> = [
      { initial: "draft", changed: "paid", method: "PUT", path: "/orders/invoices/invoice", body: { amount: 1 } },
      { initial: "draft", changed: "paid", method: "POST", path: "/orders/invoices/invoice/finalize" },
      { initial: "draft", changed: "paid", method: "DELETE", path: "/orders/invoices/invoice" },
      { initial: "draft", changed: "open", method: "DELETE", path: "/orders/invoices/invoice" },
      { initial: "open", changed: "paid", method: "DELETE", path: "/orders/invoices/invoice" },
    ];
    for (const action of cases) {
      await bindings.DB.prepare("UPDATE service_invoices SET status = ?, amount = 10000 WHERE id = 'invoice'").bind(action.initial).run();
      const response = await request(action.path, action.method, action.body, action.changed);
      expect(response.status).toBe(409);
      expect(await bindings.DB.prepare("SELECT status, amount FROM service_invoices WHERE id = 'invoice'").first()).toEqual({
        status: action.changed,
        amount: 10000,
      });
      if (action.changed === "paid") {
        expect(await bindings.DB.prepare("SELECT amount, refundedAmount FROM payment_charges WHERE id = 'charge'").first()).toEqual({
          amount: 10000,
          refundedAmount: 0,
        });
        expect(await bindings.DB.prepare("SELECT amount FROM payment_balance_transactions WHERE id = 'balance'").first("amount")).toBe(10000);
      }
    }
  });

  test("still edits, finalizes, voids, and deletes invoices in the expected state", async () => {
    await bindings.DB.batch([
      bindings.DB.prepare("DELETE FROM payment_balance_transactions WHERE id = 'balance'"),
      bindings.DB.prepare("DELETE FROM payment_charges WHERE id = 'charge'"),
      bindings.DB.prepare("DELETE FROM payment_intents WHERE id = 'intent'"),
    ]);
    await bindings.DB.prepare("UPDATE service_invoices SET status = 'draft' WHERE id = 'invoice'").run();
    expect((await request("/orders/invoices/invoice", "PUT", { amount: 20000 })).status).toBe(200);
    expect((await request("/orders/invoices/invoice/finalize", "POST")).status).toBe(200);
    expect((await request("/orders/invoices/invoice", "DELETE")).status).toBe(200);
    expect(await bindings.DB.prepare("SELECT status, amount FROM service_invoices WHERE id = 'invoice'").first()).toEqual({
      status: "void",
      amount: 20000,
    });
    await bindings.DB.prepare("UPDATE service_invoices SET status = 'draft' WHERE id = 'invoice'").run();
    expect((await request("/orders/invoices/invoice", "DELETE")).status).toBe(200);
    expect(await bindings.DB.prepare("SELECT id FROM service_invoices WHERE id = 'invoice'").first()).toBeNull();
  });
});
