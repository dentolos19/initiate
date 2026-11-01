import { and, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import {
  orderInvoice,
  paymentBalanceTransaction,
  paymentCharge,
  paymentIntent,
  paymentRefund,
} from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";
import { createPaymentReference, ensurePaymentAccount } from "#/lib/server/lib/payments.js";
import { checkMembership, getOrganization, getUser } from "#/lib/server/lib/utils.js";

const payments = new Hono();

async function getAccountSummary(organizationId: string, paymentAccountId: string) {
  const orders = await database.query.order.findMany({
    where: { organizationId },
    columns: { id: true },
  });
  const orderIds = orders.map((order) => order.id);
  const invoices = orderIds.length
    ? await database.query.orderInvoice.findMany({
        where: { orderId: { in: orderIds } },
        columns: { amount: true, currency: true, status: true },
      })
    : [];

  return {
    id: paymentAccountId,
    status: "ready" as const,
    currency: invoices[0]?.currency ?? "sgd",
    availableBalance: invoices.reduce((sum, invoice) => sum + (invoice.status === "paid" ? invoice.amount : 0), 0),
    pendingBalance: invoices.reduce((sum, invoice) => sum + (invoice.status === "open" ? invoice.amount : 0), 0),
    refundedAmount: invoices.reduce((sum, invoice) => sum + (invoice.status === "refunded" ? invoice.amount : 0), 0),
    paidInvoices: invoices.filter((invoice) => invoice.status === "paid").length,
    openInvoices: invoices.filter((invoice) => invoice.status === "open").length,
  };
}

async function getIntent(invoice: typeof orderInvoice.$inferSelect) {
  const existing = await database.query.paymentIntent.findFirst({ where: { invoiceId: invoice.id } });
  if (existing) return existing;

  const [intent] = await database
    .insert(paymentIntent)
    .values({
      id: createPaymentReference("intent"),
      amount: invoice.amount,
      currency: invoice.currency,
      customerReference: invoice.customerReference,
      invoiceId: invoice.id,
      paymentAccountId: invoice.paymentAccountId,
      status: invoice.status === "paid" || invoice.status === "refunded" ? "succeeded" : "requires_payment_method",
    })
    .onConflictDoNothing({ target: paymentIntent.invoiceId })
    .returning();
  if (intent) return intent;
  const concurrent = await database.query.paymentIntent.findFirst({ where: { invoiceId: invoice.id } });
  if (!concurrent) throw new Error("Could not create the payment intent.");
  return concurrent;
}

payments.get("/account", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  if (!user || !organization || !(await checkMembership(user.id, organization.id))) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const paymentAccountId = await ensurePaymentAccount(organization.id, organization.paymentAccountId);
  return c.json(await getAccountSummary(organization.id, paymentAccountId));
});

payments.get("/invoices/:invoiceId", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ message: "Sign in to view this invoice." }, 401);

  const invoice = await database.query.orderInvoice.findFirst({
    where: { id: c.req.param("invoiceId"), userId: user.id },
    with: {
      order: {
        with: { service: { with: { organization: true } } },
      },
    },
  });
  return invoice ? c.json(invoice) : c.json({ message: "Invoice not found." }, 404);
});

payments.post("/invoices/:invoiceId/pay", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ message: "Sign in to pay this invoice." }, 401);

  const invoice = await database.query.orderInvoice.findFirst({ where: { id: c.req.param("invoiceId") } });
  if (!invoice || invoice.userId !== user.id) return c.json({ message: "Invoice not found." }, 404);
  if (invoice.status !== "open") return c.json({ message: "Only open invoices can be paid." }, 400);

  const parsed = z.object({ outcome: z.enum(["approved", "declined"]) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Choose a valid payment outcome." }, 400);

  const intent = await getIntent(invoice);
  if (intent.status === "succeeded") {
    const current = await database.query.orderInvoice.findFirst({ where: { id: invoice.id, userId: user.id } });
    if (current?.status !== "paid") return c.json({ message: "Only open invoices can be paid." }, 400);
    return c.json({ outcome: "approved" as const, message: "Payment already completed.", invoice: current });
  }

  const chargeId = createPaymentReference("charge");

  if (parsed.data.outcome === "declined") {
    const [charges] = await database.batch([
      database
        .insert(paymentCharge)
        .select(
          database
            .select({
              id: sql<string>`${chargeId}`.as("id"),
              amount: orderInvoice.amount,
              currency: orderInvoice.currency,
              failureCode: sql<string>`${"card_declined"}`.as("failureCode"),
              failureMessage: sql<string>`${"The payment was declined."}`.as("failureMessage"),
              invoiceId: orderInvoice.id,
              paymentIntentId: sql<string>`${intent.id}`.as("paymentIntentId"),
              status: sql<string>`${"failed"}`.as("status"),
            })
            .from(orderInvoice)
            .where(and(eq(orderInvoice.id, invoice.id), eq(orderInvoice.status, "open"))),
        )
        .returning({ id: paymentCharge.id }),
      database
        .update(paymentIntent)
        .set({ latestChargeId: chargeId, status: "requires_payment_method", updatedAt: new Date() })
        .where(and(eq(paymentIntent.id, intent.id), sql`changes() = 1`)),
    ]);
    if (!charges.length) return c.json({ message: "Only open invoices can be paid." }, 400);
    return c.json({
      outcome: "declined" as const,
      message: "The payment was declined and the invoice remains open.",
      invoice,
    });
  }

  // D1 runs each batch atomically on one connection; each changes() checks the preceding statement.
  const [updatedInvoices] = await database.batch([
    database
      .update(orderInvoice)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(orderInvoice.id, invoice.id), eq(orderInvoice.status, "open")))
      .returning(),
    database.insert(paymentCharge).select(
      database
        .select({
          id: sql<string>`${chargeId}`.as("id"),
          amount: orderInvoice.amount,
          currency: orderInvoice.currency,
          invoiceId: orderInvoice.id,
          paymentIntentId: sql<string>`${intent.id}`.as("paymentIntentId"),
          status: sql<string>`${"succeeded"}`.as("status"),
        })
        .from(orderInvoice)
        .where(and(eq(orderInvoice.id, invoice.id), sql`changes() = 1`)),
    ),
    database
      .update(paymentIntent)
      .set({ latestChargeId: chargeId, status: "succeeded", updatedAt: new Date() })
      .where(and(eq(paymentIntent.id, intent.id), sql`changes() = 1`)),
    database.insert(paymentBalanceTransaction).select(
      database
        .select({
          id: sql<string>`${createPaymentReference("transaction")}`.as("id"),
          amount: paymentCharge.amount,
          currency: paymentCharge.currency,
          paymentAccountId: sql<string>`${invoice.paymentAccountId}`.as("paymentAccountId"),
          sourceId: paymentCharge.id,
          type: sql<string>`${"charge"}`.as("type"),
        })
        .from(paymentCharge)
        .where(and(eq(paymentCharge.id, chargeId), sql`changes() = 1`)),
    ),
  ]);
  const paidInvoice = updatedInvoices[0];
  if (!paidInvoice) return c.json({ message: "Only open invoices can be paid." }, 400);

  return c.json({
    outcome: "approved" as const,
    message: "Payment approved.",
    invoice: paidInvoice,
  });
});

payments.post("/invoices/:invoiceId/refund", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ message: "Sign in to refund this invoice." }, 401);

  const invoice = await database.query.orderInvoice.findFirst({
    where: { id: c.req.param("invoiceId") },
    with: { order: { columns: { organizationId: true } } },
  });
  const organizationId = invoice?.order?.organizationId;
  if (!invoice || !organizationId || !(await checkMembership(user.id, organizationId))) {
    return c.json({ message: "Invoice not found." }, 404);
  }
  if (invoice.status !== "paid") return c.json({ message: "Only paid invoices can be refunded." }, 400);

  const charge = await database.query.paymentCharge.findFirst({
    where: { invoiceId: invoice.id, status: "succeeded" },
    orderBy: { createdAt: "desc" },
  });
  const intent = charge ? undefined : await getIntent(invoice);
  const chargeId = charge?.id ?? createPaymentReference("charge");
  const refundId = createPaymentReference("refund");
  // A legacy charge is inserted immediately after the status update, only when that update succeeded.
  const [updatedInvoices] = await database.batch([
    database
      .update(orderInvoice)
      .set({ status: "refunded" })
      .where(and(eq(orderInvoice.id, invoice.id), eq(orderInvoice.status, "paid")))
      .returning(),
    ...(intent
      ? [
          database.insert(paymentCharge).select(
            database
              .select({
                id: sql<string>`${chargeId}`.as("id"),
                amount: orderInvoice.amount,
                currency: orderInvoice.currency,
                invoiceId: orderInvoice.id,
                paymentIntentId: sql<string>`${intent.id}`.as("paymentIntentId"),
                status: sql<string>`${"succeeded"}`.as("status"),
              })
              .from(orderInvoice)
              .where(and(eq(orderInvoice.id, invoice.id), sql`changes() = 1`)),
          ),
        ]
      : []),
    database.insert(paymentRefund).select(
      database
        .select({
          id: sql<string>`${refundId}`.as("id"),
          amount: orderInvoice.amount,
          chargeId: sql<string>`${chargeId}`.as("chargeId"),
          currency: orderInvoice.currency,
          invoiceId: orderInvoice.id,
          reason: sql<string>`${"requested_by_customer"}`.as("reason"),
        })
        .from(orderInvoice)
        .where(and(eq(orderInvoice.id, invoice.id), sql`changes() = 1`)),
    ),
    ...(intent
      ? [
          database
            .update(paymentIntent)
            .set({ latestChargeId: chargeId, status: "succeeded", updatedAt: new Date() })
            .where(and(eq(paymentIntent.id, intent.id), sql`changes() = 1`)),
          database.insert(paymentBalanceTransaction).select(
            database
              .select({
                id: sql<string>`${createPaymentReference("transaction")}`.as("id"),
                amount: paymentCharge.amount,
                currency: paymentCharge.currency,
                paymentAccountId: sql<string>`${invoice.paymentAccountId}`.as("paymentAccountId"),
                sourceId: paymentCharge.id,
                type: sql<string>`${"charge"}`.as("type"),
              })
              .from(paymentCharge)
              .where(and(eq(paymentCharge.id, chargeId), sql`changes() = 1`)),
          ),
        ]
      : []),
    database
      .update(paymentCharge)
      .set({ refundedAmount: invoice.amount })
      .where(and(eq(paymentCharge.id, chargeId), sql`changes() = 1`)),
    database.insert(paymentBalanceTransaction).select(
      database
        .select({
          id: sql<string>`${createPaymentReference("transaction")}`.as("id"),
          amount: sql<number>`-${paymentRefund.amount}`.as("amount"),
          currency: paymentRefund.currency,
          paymentAccountId: sql<string>`${invoice.paymentAccountId}`.as("paymentAccountId"),
          sourceId: paymentRefund.id,
          type: sql<string>`${"refund"}`.as("type"),
        })
        .from(paymentRefund)
        .where(and(eq(paymentRefund.id, refundId), sql`changes() = 1`)),
    ),
  ]);
  const refundedInvoice = updatedInvoices[0];
  if (!refundedInvoice) return c.json({ message: "Only paid invoices can be refunded." }, 400);

  return c.json({
    outcome: "approved" as const,
    message: "Refund completed.",
    invoice: refundedInvoice,
  });
});

export default payments;
