import { afterAll, beforeAll, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { Hono } from "hono";
import { Miniflare } from "miniflare";

import { type AppDatabase, createDatabase, runWithDatabase } from "#/lib/database/database.server";
import payments from "#/lib/server/routes/payments";

const miniflare = new Miniflare({
  workers: [
    {
      config: {
        name: "payments-test",
        compatibilityDate: "2026-10-01",
        manifest: {
          mainModule: "index.js",
          modules: { "index.js": { type: "esm", contents: "export default { fetch: () => new Response('ok') }" } },
        },
        env: { DB: { type: "d1", id: "payments-test" } },
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
app.route("/payments", payments);

function barrier() {
  let arrivals = 0;
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return async () => {
    if (++arrivals === 2) release();
    await ready;
  };
}

function databaseWithHooks(hooks: { beforeBatch?: () => Promise<void>; afterIntentRead?: () => Promise<void> }) {
  let intentReads = 0;
  function wrap(statement: D1PreparedStatement): D1PreparedStatement {
    return new Proxy(statement, {
      get(target, property) {
        if (property === "bind")
          return (...values: Parameters<D1PreparedStatement["bind"]>) => wrap(target.bind(...values));
        if (property === "raw")
          return async () => {
            const result = await target.raw();
            if (++intentReads <= 2) await hooks.afterIntentRead?.();
            return result;
          };
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }
  const client = new Proxy(bindings.DB, {
    get(target, property) {
      if (property === "batch")
        return async (statements: D1PreparedStatement[]) => {
          await hooks.beforeBatch?.();
          return target.batch(statements);
        };
      if (property === "prepare")
        return (query: string) => {
          const statement = target.prepare(query);
          return hooks.afterIntentRead && query.includes('from "payment_intents"') ? wrap(statement) : statement;
        };
      const value: unknown = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return createDatabase(client);
}

function request(db: AppDatabase, invoiceId: string, action: "pay" | "refund", userId: string, outcome?: string) {
  return runWithDatabase(db, undefined, () =>
    app.request(
      `/payments/invoices/${invoiceId}/${action}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Test-User": userId },
        body: outcome ? JSON.stringify({ outcome }) : undefined,
      },
      bindings,
    ),
  );
}

async function addInvoice(id: string, status: string) {
  await bindings.DB.prepare(
    `INSERT INTO service_invoices
    (id, orderId, userId, amount, currency, status, paymentAccountId, customerReference, reference)
    VALUES (?, 'order', 'buyer', 12500, 'sgd', ?, 'account', 'customer', ?)`,
  )
    .bind(id, status, `ref-${id}`)
    .run();
}

async function ledger(id: string) {
  const [invoice, intents, charges, refunds, transactions] = await Promise.all([
    bindings.DB.prepare("SELECT status FROM service_invoices WHERE id = ?").bind(id).first<{ status: string }>(),
    bindings.DB.prepare("SELECT id, status, latestChargeId FROM payment_intents WHERE invoiceId = ?").bind(id).all(),
    bindings.DB.prepare("SELECT id, status, amount, refundedAmount FROM payment_charges WHERE invoiceId = ?")
      .bind(id)
      .all(),
    bindings.DB.prepare("SELECT id, chargeId, amount FROM payment_refunds WHERE invoiceId = ?").bind(id).all(),
    bindings.DB.prepare(
      `SELECT type, amount, sourceId FROM payment_balance_transactions
      WHERE sourceId IN (SELECT id FROM payment_charges WHERE invoiceId = ?)
         OR sourceId IN (SELECT id FROM payment_refunds WHERE invoiceId = ?)`,
    )
      .bind(id, id)
      .all(),
  ]);
  return {
    invoice,
    intents: intents.results,
    charges: charges.results,
    refunds: refunds.results,
    transactions: transactions.results,
  };
}

beforeAll(async () => {
  bindings = await miniflare.getBindings<Env>();
  database = createDatabase(bindings.DB);
  const migrations = join(import.meta.dir, "../migrations");
  for (const name of readdirSync(migrations).sort()) {
    const source = readFileSync(join(migrations, name, "migration.sql"), "utf8");
    for (const statement of source.split("--> statement-breakpoint")) {
      if (statement.trim()) await bindings.DB.prepare(statement).run();
    }
  }
  await bindings.DB.batch([
    bindings.DB.prepare(
      "INSERT INTO users (id, firstName, type) VALUES ('buyer', 'Buyer', 'user'), ('provider', 'Provider', 'user')",
    ),
    bindings.DB.prepare("INSERT INTO organizations (id, name) VALUES ('provider-org', 'Provider')"),
    bindings.DB.prepare(
      "INSERT INTO auth_members (id, organizationId, userId) VALUES ('member', 'provider-org', 'provider')",
    ),
    bindings.DB.prepare(
      "INSERT INTO service_orders (id, userId, organizationId, name, status) VALUES ('order', 'buyer', 'provider-org', 'Order', 'pending')",
    ),
  ]);
});

afterAll(async () => miniflare.dispose());

test("concurrent approvals create one intent, charge, and balance entry", async () => {
  await addInvoice("pay-race", "open");
  let intentReads = 0;
  const waitForIntentReads = barrier();
  const db = databaseWithHooks({
    afterIntentRead: async () => {
      intentReads++;
      await waitForIntentReads();
    },
    beforeBatch: barrier(),
  });
  const responses = await Promise.all([
    request(db, "pay-race", "pay", "buyer", "approved"),
    request(db, "pay-race", "pay", "buyer", "approved"),
  ]);
  expect(intentReads).toBe(2);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
  const result = await ledger("pay-race");
  expect(result.invoice?.status).toBe("paid");
  expect(result.intents).toHaveLength(1);
  expect(result.intents[0].status).toBe("succeeded");
  expect(result.charges).toHaveLength(1);
  expect(result.charges[0]).toMatchObject({ status: "succeeded", amount: 12500, refundedAmount: 0 });
  expect(result.intents[0].latestChargeId).toBe(result.charges[0].id);
  expect(result.transactions).toEqual([{ type: "charge", amount: 12500, sourceId: result.charges[0].id }]);
});

test("a concurrent decline never overwrites an approved payment", async () => {
  await addInvoice("decline-race", "open");
  const db = databaseWithHooks({ beforeBatch: barrier() });
  const responses = await Promise.all([
    request(db, "decline-race", "pay", "buyer", "declined"),
    request(db, "decline-race", "pay", "buyer", "approved"),
  ]);
  expect(responses[1].status).toBe(200);
  const result = await ledger("decline-race");
  expect(result.invoice?.status).toBe("paid");
  expect(result.intents[0].status).toBe("succeeded");
  const succeeded = result.charges.filter((charge) => charge.status === "succeeded");
  expect(succeeded).toHaveLength(1);
  expect(result.intents[0].latestChargeId).toBe(succeeded[0].id);
  expect(result.transactions).toEqual([{ type: "charge", amount: 12500, sourceId: succeeded[0].id }]);
});

test("only one concurrent refund is recorded for an existing charge", async () => {
  await addInvoice("refund-race", "open");
  expect((await request(database, "refund-race", "pay", "buyer", "approved")).status).toBe(200);
  const db = databaseWithHooks({ beforeBatch: barrier() });
  const responses = await Promise.all([
    request(db, "refund-race", "refund", "provider"),
    request(db, "refund-race", "refund", "provider"),
  ]);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
  const result = await ledger("refund-race");
  expect(result.invoice?.status).toBe("refunded");
  expect(result.charges).toHaveLength(1);
  expect(result.charges[0].refundedAmount).toBe(12500);
  expect(result.refunds).toHaveLength(1);
  expect(result.refunds[0]).toMatchObject({ amount: 12500, chargeId: result.charges[0].id });
  expect(result.transactions).toHaveLength(2);
  expect(result.transactions).toContainEqual({ type: "refund", amount: -12500, sourceId: result.refunds[0].id });
});

test("concurrent refunds backfill one legacy charge atomically", async () => {
  await addInvoice("legacy-refund", "paid");
  let intentReads = 0;
  const waitForIntentReads = barrier();
  const db = databaseWithHooks({
    afterIntentRead: async () => {
      intentReads++;
      await waitForIntentReads();
    },
    beforeBatch: barrier(),
  });
  const responses = await Promise.all([
    request(db, "legacy-refund", "refund", "provider"),
    request(db, "legacy-refund", "refund", "provider"),
  ]);
  expect(intentReads).toBe(2);
  expect(responses.map((response) => response.status).sort()).toEqual([200, 400]);
  const result = await ledger("legacy-refund");
  expect(result.invoice?.status).toBe("refunded");
  expect(result.intents).toHaveLength(1);
  expect(result.intents[0].status).toBe("succeeded");
  expect(result.charges).toHaveLength(1);
  expect(result.charges[0]).toMatchObject({ status: "succeeded", amount: 12500, refundedAmount: 12500 });
  expect(result.intents[0].latestChargeId).toBe(result.charges[0].id);
  expect(result.refunds).toHaveLength(1);
  expect(result.refunds[0]).toMatchObject({ amount: 12500, chargeId: result.charges[0].id });
  expect(result.transactions).toHaveLength(2);
  expect(result.transactions).toContainEqual({ type: "charge", amount: 12500, sourceId: result.charges[0].id });
  expect(result.transactions).toContainEqual({ type: "refund", amount: -12500, sourceId: result.refunds[0].id });
});

test("cancellation before the payment batch leaves no charge or balance entries", async () => {
  for (const outcome of ["approved", "declined"]) {
    const id = `cancel-${outcome}`;
    await addInvoice(id, "open");
    const db = databaseWithHooks({
      beforeBatch: async () => {
        await bindings.DB.prepare("UPDATE service_invoices SET status='void' WHERE id=?").bind(id).run();
      },
    });
    expect((await request(db, id, "pay", "buyer", outcome)).status).toBe(400);
    const result = await ledger(id);
    expect(result.invoice?.status).toBe("void");
    expect(result.charges).toHaveLength(0);
    expect(result.transactions).toHaveLength(0);
  }
});

test("a failed legacy refund rolls back the invoice and backfilled charge", async () => {
  await addInvoice("legacy-rollback", "paid");
  await bindings.DB.prepare(
    `CREATE TRIGGER block_refund_balance BEFORE INSERT ON payment_balance_transactions
    WHEN NEW.type = 'refund' BEGIN SELECT RAISE(ABORT, 'blocked refund'); END`,
  ).run();
  try {
    const response = await request(database, "legacy-rollback", "refund", "provider");
    expect(response.status).toBe(500);
    const result = await ledger("legacy-rollback");
    expect(result.invoice?.status).toBe("paid");
    expect(result.charges).toHaveLength(0);
    expect(result.refunds).toHaveLength(0);
    expect(result.transactions).toHaveLength(0);
  } finally {
    await bindings.DB.prepare("DROP TRIGGER block_refund_balance").run();
  }
});
