import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { Hono } from "hono";
import { Miniflare } from "miniflare";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { createDatabase, runWithDatabase, type AppDatabase } from "#/lib/database/database.server";
import { createBucketClient } from "#/lib/server/integrations/bucket";
import { createNotificationClient } from "#/lib/server/integrations/notification";
import orderMilestones from "#/lib/server/routes/order-milestones";
import orders from "#/lib/server/routes/orders";

const miniflare = new Miniflare({
  workers: [{
    config: {
      name: "order-access-test",
      compatibilityDate: "2026-10-01",
      manifest: {
        mainModule: "index.js",
        modules: { "index.js": { type: "esm", contents: "export default { fetch: () => new Response('ok') }" } },
      },
      env: { DB: { type: "d1", id: "order-access-test" } },
    },
  }],
});
let bindings: Env;
let database: AppDatabase;
const notifications: string[] = [];
const app = new Hono<{ Bindings: Env }>();

app.use("*", async (context, next) => {
  context.set("auth", { userId: context.req.header("X-Test-User") ?? null, orgId: null });
  context.set("integrations", {
    database,
    bucket: createBucketClient(context),
    notification: {
      ...createNotificationClient(context, database),
      queueNotification: async (_audience: string[], data: { content?: ReactNode }) => {
        notifications.push(typeof data.content === "string" ? data.content : renderToStaticMarkup(data.content));
      },
    },
  });
  await next();
});
app.route("/orders", orderMilestones);
app.route("/orders", orders);

function request(userId: string | null, path: string, method = "GET", body?: unknown) {
  const headers = new Headers({ "Content-Type": "application/json", "X-Organization-Id": "provider-org" });
  if (userId) headers.set("X-Test-User", userId);
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

  await bindings.DB.batch([
    bindings.DB.prepare(`
    INSERT INTO users (id, firstName, type) VALUES
      ('buyer', 'Buyer', 'user'), ('provider', 'Provider', 'user'),
      ('stranger', 'Stranger', 'user'), ('admin', 'Admin', 'admin')`),
    bindings.DB.prepare("INSERT INTO organizations (id, name) VALUES ('provider-org', 'Provider')"),
    bindings.DB.prepare("INSERT INTO auth_members (id, organizationId, userId) VALUES ('member', 'provider-org', 'provider')"),
    bindings.DB.prepare(`INSERT INTO service_orders (id, userId, organizationId, name, status)
      VALUES ('order', 'buyer', 'provider-org', 'Order', 'proposed')`),
    bindings.DB.prepare(`INSERT INTO order_milestones (id, orderId, name, status)
      VALUES ('milestone', 'order', 'Milestone', 'draft')`),
  ]);
});

beforeEach(async () => {
  notifications.length = 0;
  await bindings.DB.prepare("UPDATE service_orders SET status = 'proposed', name = 'Order' WHERE id = 'order'").run();
});

afterAll(async () => miniflare.dispose());

describe("order authorization", () => {
  test("only the buyer, provider member, or admin can read orders and milestones", async () => {
    for (const path of ["/orders/order", "/orders/order/milestones", "/orders/order/milestones/milestone"]) {
      expect((await request(null, path)).status).toBe(401);
      expect((await request("stranger", path)).status).toBe(404);
      for (const userId of ["buyer", "provider", "admin"]) {
        expect((await request(userId, path)).status).toBe(200);
      }
    }
  });

  test("rejects unauthorized mutations even if the caller supplies the provider organization ID", async () => {
    const actions: Array<[string, string, unknown?]> = [
      ["PUT", "/orders/order", { name: "Changed" }],
      ["PATCH", "/orders/order/status", { status: "confirmed" }],
      ["POST", "/orders/order/milestones", { name: "Injected" }],
      ["PUT", "/orders/order/milestones/milestone", { name: "Changed" }],
      ["PATCH", "/orders/order/milestones/milestone", { status: "completed" }],
      ["DELETE", "/orders/order/milestones/milestone"],
    ];
    for (const [method, path, body] of actions) {
      expect((await request("stranger", path, method, body)).status).toBe(404);
    }
    expect(await bindings.DB.prepare("SELECT name, status FROM service_orders").first()).toEqual({
      name: "Order",
      status: "proposed",
    });
    expect(await bindings.DB.prepare("SELECT name FROM order_milestones").first("name")).toBe("Milestone");
  });

  test("preserves provider and admin management while preventing the buyer from editing milestones", async () => {
    const actions: Array<[string, string, unknown?]> = [
      ["PUT", "/orders/order", { name: "No" }],
      ["POST", "/orders/order/milestones", { name: "No" }],
      ["PUT", "/orders/order/milestones/milestone", { name: "No" }],
      ["PATCH", "/orders/order/milestones/milestone", { status: "completed" }],
      ["DELETE", "/orders/order/milestones/milestone"],
    ];
    for (const [method, path, body] of actions) {
      expect((await request("buyer", path, method, body)).status).toBe(403);
    }
    expect((await request("provider", "/orders/order/milestones", "POST", { name: "Created" })).status).toBe(200);
    expect((await request("provider", "/orders/order/milestones/milestone", "PUT", { name: "Revised" })).status).toBe(200);
    expect((await request("admin", "/orders/order/milestones/milestone", "PATCH", { status: "completed" })).status).toBe(200);
    expect((await request("provider", "/orders/order", "PUT", { name: "Updated", status: "confirmed" })).status).toBe(400);
    expect((await request("provider", "/orders/order", "PUT", { name: "Updated" })).status).toBe(200);
    expect((await request("provider", "/orders/order/milestones/milestone", "DELETE")).status).toBe(200);
  });

  test("restricts order status transitions to the responsible participant", async () => {
    expect((await request("provider", "/orders/order/status", "PATCH", { status: "confirmed" })).status).toBe(403);
    expect((await request("buyer", "/orders/order/status", "PATCH", { status: "confirmed" })).status).toBe(200);
    await bindings.DB.prepare("UPDATE service_orders SET status = 'pending' WHERE id = 'order'").run();
    expect((await request("buyer", "/orders/order/status", "PATCH", { status: "confirmed" })).status).toBe(403);
    expect((await request("provider", "/orders/order/status", "PATCH", { status: "confirmed" })).status).toBe(200);
    expect((await request("admin", "/orders/order/status", "PATCH", { status: "draft" })).status).toBe(200);
  });

  test("confirmation opens only invoices that are still drafts", async () => {
    await bindings.DB.batch([
      bindings.DB.prepare("INSERT INTO service_orders (id, userId, organizationId, name, status) VALUES ('confirm-order', 'buyer', 'provider-org', 'Confirm', 'pending')"),
      bindings.DB.prepare(`INSERT INTO service_invoices (id, orderId, userId, amount, status, paymentAccountId, customerReference, reference) VALUES
        ('confirm-draft', 'confirm-order', 'buyer', 10000, 'draft', 'acct', 'customer', 'ref-confirm-draft'),
        ('confirm-void', 'confirm-order', 'buyer', 10000, 'void', 'acct', 'customer', 'ref-confirm-void'),
        ('confirm-paid', 'confirm-order', 'buyer', 10000, 'paid', 'acct', 'customer', 'ref-confirm-paid')`),
    ]);

    expect((await request("provider", "/orders/confirm-order/status", "PATCH", { status: "confirmed" })).status).toBe(200);
    expect((await bindings.DB.prepare("SELECT id, status FROM service_invoices WHERE orderId = 'confirm-order' ORDER BY id").all()).results).toEqual([
      { id: "confirm-draft", status: "open" },
      { id: "confirm-paid", status: "paid" },
      { id: "confirm-void", status: "void" },
    ]);

    await bindings.DB.batch([
      bindings.DB.prepare("DELETE FROM service_invoices WHERE orderId = 'confirm-order'"),
      bindings.DB.prepare("DELETE FROM service_orders WHERE id = 'confirm-order'"),
    ]);
  });

  test("cancellation voids only unpaid invoices without claiming or recording a refund", async () => {
    await bindings.DB.batch([
      bindings.DB.prepare("INSERT INTO services (id, organizationId, name) VALUES ('service', 'provider-org', 'Service')"),
      bindings.DB.prepare("INSERT INTO service_plans (id, serviceId, name, amount) VALUES ('plan', 'service', 'Plan', 10000)"),
      bindings.DB.prepare("UPDATE service_orders SET status = 'pending', serviceId = 'service', planId = 'plan' WHERE id = 'order'"),
      bindings.DB.prepare("INSERT INTO service_orders (id, userId, organizationId, name, status) VALUES ('other', 'buyer', 'provider-org', 'Other', 'pending')"),
      bindings.DB.prepare(`INSERT INTO service_invoices (id, orderId, userId, amount, status, paymentAccountId, customerReference, reference) VALUES
        ('draft', 'order', 'buyer', 10000, 'draft', 'acct', 'customer', 'ref-draft'),
        ('open', 'order', 'buyer', 10000, 'open', 'acct', 'customer', 'ref-open'),
        ('paid', 'order', 'buyer', 10000, 'paid', 'acct', 'customer', 'ref-paid'),
        ('refunded', 'order', 'buyer', 10000, 'refunded', 'acct', 'customer', 'ref-refunded'),
        ('void', 'order', 'buyer', 10000, 'void', 'acct', 'customer', 'ref-void'),
        ('other-open', 'other', 'buyer', 10000, 'open', 'acct', 'customer', 'ref-other')`),
      bindings.DB.prepare(`INSERT INTO payment_intents (id, invoiceId, paymentAccountId, customerReference, amount, currency, status, latestChargeId) VALUES
        ('intent-paid', 'paid', 'acct', 'customer', 10000, 'sgd', 'succeeded', 'charge-paid'),
        ('intent-refunded', 'refunded', 'acct', 'customer', 10000, 'sgd', 'succeeded', 'charge-refunded')`),
      bindings.DB.prepare(`INSERT INTO payment_charges (id, paymentIntentId, invoiceId, amount, currency, status, refundedAmount) VALUES
        ('charge-paid', 'intent-paid', 'paid', 10000, 'sgd', 'succeeded', 0),
        ('charge-refunded', 'intent-refunded', 'refunded', 10000, 'sgd', 'succeeded', 10000)`),
      bindings.DB.prepare(`INSERT INTO payment_refunds (id, chargeId, invoiceId, amount, currency) VALUES
        ('refund', 'charge-refunded', 'refunded', 10000, 'sgd')`),
      bindings.DB.prepare(`INSERT INTO payment_balance_transactions (id, paymentAccountId, sourceId, type, amount, currency) VALUES
        ('charge-balance', 'acct', 'charge-paid', 'charge', 10000, 'sgd'),
        ('refund-balance', 'acct', 'refund', 'refund', -10000, 'sgd')`),
    ]);

    const ledger = async () => Promise.all([
      bindings.DB.prepare("SELECT * FROM payment_intents ORDER BY id").all(),
      bindings.DB.prepare("SELECT * FROM payment_charges ORDER BY id").all(),
      bindings.DB.prepare("SELECT * FROM payment_refunds ORDER BY id").all(),
      bindings.DB.prepare("SELECT * FROM payment_balance_transactions ORDER BY id").all(),
    ]).then((results) => results.map((result) => result.results));
    const before = await ledger();

    expect((await request("buyer", "/orders/order/status", "PATCH", { status: "cancelled" })).status).toBe(200);
    expect((await bindings.DB.prepare("SELECT id, status FROM service_invoices ORDER BY id").all()).results).toEqual([
      { id: "draft", status: "void" },
      { id: "open", status: "void" },
      { id: "other-open", status: "open" },
      { id: "paid", status: "paid" },
      { id: "refunded", status: "refunded" },
      { id: "void", status: "void" },
    ]);
    expect(await ledger()).toEqual(before);
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0]).not.toMatch(/refund|processing time/i);
  });
});
