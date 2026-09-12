import { and, eq } from "drizzle-orm";
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
    .returning();
  return intent;
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
    return c.json({ outcome: "approved" as const, message: "Payment already completed.", invoice });
  }

  const chargeId = createPaymentReference("charge");

  if (parsed.data.outcome === "declined") {
    await database.batch([
      database.insert(paymentCharge).values({
        id: chargeId,
        amount: invoice.amount,
        currency: invoice.currency,
        failureCode: "card_declined",
        failureMessage: "The payment was declined.",
        invoiceId: invoice.id,
        paymentIntentId: intent.id,
        status: "failed",
      }),
      database
        .update(paymentIntent)
        .set({ latestChargeId: chargeId, status: "requires_payment_method", updatedAt: new Date() })
        .where(eq(paymentIntent.id, intent.id)),
    ]);
    return c.json({
      outcome: "declined" as const,
      message: "The payment was declined and the invoice remains open.",
      invoice,
    });
  }

  const [updatedInvoices] = await database.batch([
    database
      .update(orderInvoice)
      .set({ status: "paid", paidAt: new Date() })
      .where(and(eq(orderInvoice.id, invoice.id), eq(orderInvoice.status, "open")))
      .returning(),
    database.insert(paymentCharge).values({
      id: chargeId,
      amount: invoice.amount,
      currency: invoice.currency,
      invoiceId: invoice.id,
      paymentIntentId: intent.id,
      status: "succeeded",
    }),
    database
      .update(paymentIntent)
      .set({ latestChargeId: chargeId, status: "succeeded", updatedAt: new Date() })
      .where(eq(paymentIntent.id, intent.id)),
    database.insert(paymentBalanceTransaction).values({
      id: createPaymentReference("transaction"),
      amount: invoice.amount,
      currency: invoice.currency,
      paymentAccountId: invoice.paymentAccountId,
      sourceId: chargeId,
      type: "charge",
    }),
  ]);
  const paidInvoice = updatedInvoices[0];
  if (!paidInvoice) throw new Error("The invoice is no longer open.");

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

  let charge = await database.query.paymentCharge.findFirst({
    where: { invoiceId: invoice.id, status: "succeeded" },
    orderBy: { createdAt: "desc" },
  });
  if (!charge) {
    const intent = await getIntent(invoice);
    const chargeId = createPaymentReference("charge");
    [charge] = await database
      .insert(paymentCharge)
      .values({
        id: chargeId,
        amount: invoice.amount,
        currency: invoice.currency,
        invoiceId: invoice.id,
        paymentIntentId: intent.id,
        status: "succeeded",
      })
      .returning();
    await database
      .update(paymentIntent)
      .set({ latestChargeId: chargeId, status: "succeeded", updatedAt: new Date() })
      .where(eq(paymentIntent.id, intent.id));
    await database.insert(paymentBalanceTransaction).values({
      id: createPaymentReference("transaction"),
      amount: invoice.amount,
      currency: invoice.currency,
      paymentAccountId: invoice.paymentAccountId,
      sourceId: chargeId,
      type: "charge",
    });
  }

  const refundId = createPaymentReference("refund");
  const [updatedInvoices] = await database.batch([
    database
      .update(orderInvoice)
      .set({ status: "refunded" })
      .where(and(eq(orderInvoice.id, invoice.id), eq(orderInvoice.status, "paid")))
      .returning(),
    database.insert(paymentRefund).values({
      id: refundId,
      amount: invoice.amount,
      chargeId: charge.id,
      currency: invoice.currency,
      invoiceId: invoice.id,
      reason: "requested_by_customer",
    }),
    database.update(paymentCharge).set({ refundedAmount: invoice.amount }).where(eq(paymentCharge.id, charge.id)),
    database.insert(paymentBalanceTransaction).values({
      id: createPaymentReference("transaction"),
      amount: -invoice.amount,
      currency: invoice.currency,
      paymentAccountId: invoice.paymentAccountId,
      sourceId: refundId,
      type: "refund",
    }),
  ]);
  const refundedInvoice = updatedInvoices[0];
  if (!refundedInvoice) throw new Error("The invoice is no longer paid.");

  return c.json({
    outcome: "approved" as const,
    message: "Refund completed.",
    invoice: refundedInvoice,
  });
});

export default payments;
