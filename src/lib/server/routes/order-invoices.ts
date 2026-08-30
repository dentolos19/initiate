import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { orderInvoice } from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";
import { createPaymentReference, ensurePaymentAccount } from "#/lib/server/lib/payments.js";
import { checkMembership, getUser } from "#/lib/server/lib/utils.js";

const orderInvoices = new Hono();

async function getInvoice(invoiceId: string) {
  return database.query.orderInvoice.findFirst({
    where: { id: invoiceId },
    with: { order: { columns: { organizationId: true, userId: true } } },
  });
}

async function canManage(userId: string, organizationId?: string | null) {
  return organizationId ? checkMembership(userId, organizationId) : false;
}

orderInvoices.put("/invoices/:invoiceId", async (c) => {
  const user = await getUser(c);
  const invoice = await getInvoice(c.req.param("invoiceId"));
  if (!user || !invoice || !(await canManage(user.id, invoice.order?.organizationId))) {
    return c.json({ message: "Invoice not found." }, 404);
  }
  if (invoice.status !== "draft") return c.json({ message: "Only draft invoices can be edited." }, 400);

  const parsed = z
    .object({
      milestoneId: z.string().nullable().optional(),
      currency: z.string().length(3).optional(),
      amount: z.number().int().positive().optional(),
      description: z.string().optional(),
    })
    .safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Invalid request body." }, 400);

  const [updatedInvoice] = await database
    .update(orderInvoice)
    .set(parsed.data)
    .where(eq(orderInvoice.id, invoice.id))
    .returning();
  return c.json(updatedInvoice);
});

orderInvoices.delete("/invoices/:invoiceId", async (c) => {
  const user = await getUser(c);
  const invoice = await getInvoice(c.req.param("invoiceId"));
  if (!user || !invoice || !(await canManage(user.id, invoice.order?.organizationId))) {
    return c.json({ message: "Invoice not found." }, 404);
  }

  if (invoice.status === "draft") {
    await database.delete(orderInvoice).where(eq(orderInvoice.id, invoice.id));
  } else if (invoice.status === "open") {
    await database.update(orderInvoice).set({ status: "void" }).where(eq(orderInvoice.id, invoice.id));
  } else {
    return c.json({ message: "Only draft or open invoices can be removed." }, 400);
  }
  return c.json({ message: invoice.status === "draft" ? "Invoice deleted." : "Invoice voided." });
});

orderInvoices.post("/invoices/:invoiceId/finalize", async (c) => {
  const user = await getUser(c);
  const invoice = await getInvoice(c.req.param("invoiceId"));
  if (!user || !invoice || !(await canManage(user.id, invoice.order?.organizationId))) {
    return c.json({ message: "Invoice not found." }, 404);
  }
  if (invoice.status !== "draft") return c.json({ message: "Only draft invoices can be finalized." }, 400);

  const [updatedInvoice] = await database
    .update(orderInvoice)
    .set({ status: "open" })
    .where(eq(orderInvoice.id, invoice.id))
    .returning();
  return c.json(updatedInvoice);
});

orderInvoices.post("/:orderId/invoices", async (c) => {
  const user = await getUser(c);
  const order = await database.query.order.findFirst({
    where: { id: c.req.param("orderId") },
    columns: { id: true, userId: true, organizationId: true },
    with: { organization: true },
  });
  if (!user || !order?.userId || !order.organizationId || !order.organization) {
    return c.json({ message: "Order not found." }, 404);
  }
  if (!(await canManage(user.id, order.organizationId))) return c.json({ message: "Unauthorized." }, 401);

  const parsed = z
    .object({
      milestoneId: z.string().nullable().optional(),
      currency: z.string().length(3).default("sgd"),
      amount: z.number().int().positive(),
      description: z.string().optional(),
    })
    .safeParse(await c.req.json());
  if (!parsed.success) return c.json({ message: "Invalid request body." }, 400);

  const paymentAccountId = await ensurePaymentAccount(order.organizationId, order.organization.paymentAccountId);
  const [invoice] = await database
    .insert(orderInvoice)
    .values({
      userId: order.userId,
      orderId: order.id,
      milestoneId: parsed.data.milestoneId,
      paymentAccountId,
      customerReference: createPaymentReference("customer"),
      reference: createPaymentReference("invoice"),
      status: "draft",
      currency: parsed.data.currency,
      amount: parsed.data.amount,
      description: parsed.data.description,
    })
    .returning();
  return c.json(invoice);
});

orderInvoices.get("/:orderId/invoices", async (c) => {
  const user = await getUser(c);
  const order = await database.query.order.findFirst({
    where: { id: c.req.param("orderId") },
    columns: { id: true, userId: true, organizationId: true },
  });
  if (!user || !order) return c.json({ message: "Order not found." }, 404);

  const authorized = order.userId === user.id || (await canManage(user.id, order.organizationId));
  if (!authorized) return c.json({ message: "Order not found." }, 404);

  return c.json(
    await database.query.orderInvoice.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } }),
  );
});

export default orderInvoices;
