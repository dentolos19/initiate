import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { orderInvoice } from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";
import { ensurePaymentAccount } from "#/lib/server/lib/payments.js";
import { checkMembership, getOrganization, getUser } from "#/lib/server/lib/utils.js";

const payments = new Hono();

async function getAccountSummary(organizationId: string, paymentAccountId: string | null) {
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
    mode: "demo" as const,
    status: paymentAccountId ? ("ready" as const) : ("setup" as const),
    currency: invoices[0]?.currency ?? "sgd",
    availableBalance: invoices.reduce((sum, invoice) => sum + (invoice.status === "paid" ? invoice.amount : 0), 0),
    pendingBalance: invoices.reduce((sum, invoice) => sum + (invoice.status === "open" ? invoice.amount : 0), 0),
    refundedAmount: invoices.reduce((sum, invoice) => sum + (invoice.status === "refunded" ? invoice.amount : 0), 0),
    paidInvoices: invoices.filter((invoice) => invoice.status === "paid").length,
    openInvoices: invoices.filter((invoice) => invoice.status === "open").length,
  };
}

payments.get("/account", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);
  if (!user || !organization || !(await checkMembership(user.id, organization.id))) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  return c.json(await getAccountSummary(organization.id, organization.paymentAccountId));
});

payments.post("/account", async (c) => {
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
  if (!user) return c.json({ message: "Sign in to run a demo payment." }, 401);

  const invoice = await database.query.orderInvoice.findFirst({ where: { id: c.req.param("invoiceId") } });
  if (!invoice || invoice.userId !== user.id) return c.json({ message: "Invoice not found." }, 404);
  if (invoice.status !== "open") return c.json({ message: "Only open invoices can be paid." }, 400);

  const parsed = z.object({ outcome: z.enum(["approved", "declined"]) }).safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Choose a valid demo outcome." }, 400);

  if (parsed.data.outcome === "declined") {
    return c.json({
      outcome: "declined" as const,
      message: "The demo card was declined. No money moved and the invoice remains open.",
      invoice,
    });
  }

  const [paidInvoice] = await database
    .update(orderInvoice)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(orderInvoice.id, invoice.id))
    .returning();

  return c.json({
    outcome: "approved" as const,
    message: "Demo payment approved. No real money was moved.",
    invoice: paidInvoice,
  });
});

payments.post("/invoices/:invoiceId/refund", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ message: "Sign in to run a demo refund." }, 401);

  const invoice = await database.query.orderInvoice.findFirst({
    where: { id: c.req.param("invoiceId") },
    with: { order: { columns: { organizationId: true } } },
  });
  const organizationId = invoice?.order?.organizationId;
  if (!invoice || !organizationId || !(await checkMembership(user.id, organizationId))) {
    return c.json({ message: "Invoice not found." }, 404);
  }
  if (invoice.status !== "paid") return c.json({ message: "Only paid invoices can be refunded." }, 400);

  const [refundedInvoice] = await database
    .update(orderInvoice)
    .set({ status: "refunded" })
    .where(eq(orderInvoice.id, invoice.id))
    .returning();

  return c.json({
    outcome: "approved" as const,
    message: "Demo refund completed. No real money was moved.",
    invoice: refundedInvoice,
  });
});

export default payments;
