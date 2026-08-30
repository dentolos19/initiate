import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { orderInvoice } from "#/lib/database/schema.js";
import { stripe } from "#/lib/server/integrations.js";
import { database } from "#/lib/server/integrations/database.js";
import { getCustomer } from "#/lib/server/lib/utils.js";

const orderInvoices = new Hono();

// Update invoice
orderInvoices.put("/invoices/:invoiceId", async (c) => {
  const invoiceId = c.req.param("invoiceId");

  const invoice = await database.query.orderInvoice.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (invoice.status !== "draft") {
    throw new Error("Only draft invoices can be edited.");
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      milestoneId: z.string().nullable().optional(),
      currency: z.string().optional(),
      amount: z.number().int().positive().optional(),
      description: z.string().optional(),
    })
    .safeParse(body);

  if (!success) {
    throw new Error("Invalid request body.");
  }

  // Get invoice items from Stripe
  const stripeInvoice = await stripe.invoices.update(
    invoice.stripeInvoiceId,
    {
      description: data.description,
      expand: ["lines"],
      metadata: {
        ...(data.milestoneId ? { milestoneId: data.milestoneId } : {}),
        ...(data.description ? { description: data.description } : {}),
      },
    },
    { stripeAccount: invoice.stripeAccountId },
  );

  // Delete existing invoice items
  await Promise.all(
    stripeInvoice.lines.data.map((item) =>
      stripe.invoiceItems.del(item.id, {}, { stripeAccount: invoice.stripeAccountId }),
    ),
  );

  // Create new invoice item
  const stripeInvoiceItem = await stripe.invoiceItems.create(
    {
      customer: invoice.stripeCustomerId,
      invoice: invoice.stripeInvoiceId,
      currency: data.currency || invoice.currency,
      amount: data.amount || invoice.amount,
      description: data.description,
    },
    { stripeAccount: invoice.stripeAccountId },
  );

  // Update the invoice in the database
  const [updatedInvoice] = await database
    .update(orderInvoice)
    .set({
      currency: stripeInvoiceItem.currency,
      amount: stripeInvoiceItem.amount,
      description: data.description,
      milestoneId: data.milestoneId,
    })
    .where(eq(orderInvoice.id, invoiceId))
    .returning();

  return c.json(updatedInvoice);
});

// Delete/void invoice
orderInvoices.delete("/invoices/:invoiceId", async (c) => {
  const invoiceId = c.req.param("invoiceId");

  const invoice = await database.query.orderInvoice.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (invoice.status === "draft") {
    await stripe.invoices.del(invoice.stripeInvoiceId, {}, { stripeAccount: invoice.stripeAccountId });
    await database.delete(orderInvoice).where(eq(orderInvoice.id, invoiceId));
  } else if (invoice.status === "open") {
    await stripe.invoices.voidInvoice(invoice.stripeInvoiceId, {}, { stripeAccount: invoice.stripeAccountId });
    await database.update(orderInvoice).set({ status: "void" }).where(eq(orderInvoice.id, invoiceId));
  } else {
    throw new Error("Invoice cannot be deleted or voided.");
  }

  return c.json({ message: "Invoice deleted successfully." });
});

// Finalize invoice
orderInvoices.post("/invoices/:invoiceId/finalize", async (c) => {
  const invoiceId = c.req.param("invoiceId");

  const invoice = await database.query.orderInvoice.findFirst({
    where: {
      id: invoiceId,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  if (invoice.status !== "draft") {
    throw new Error("Only draft invoices can be finalized.");
  }

  // Finalize the invoice in Stripe
  const stripeInvoice = await stripe.invoices.finalizeInvoice(
    invoice.stripeInvoiceId,
    {},
    { stripeAccount: invoice.stripeAccountId },
  );

  // Update the invoice in the database
  const [updatedInvoice] = await database
    .update(orderInvoice)
    .set({
      status: stripeInvoice.status || "open",
      url: stripeInvoice.hosted_invoice_url,
    })
    .where(eq(orderInvoice.id, invoiceId))
    .returning();

  return c.json(updatedInvoice);
});

// Create new invoice
orderInvoices.post("/:orderId/invoices", async (c) => {
  const orderId = c.req.param("orderId");

  const order = await database.query.order.findFirst({
    where: {
      id: orderId,
    },
    columns: {
      id: true,
      userId: true,
    },
    with: {
      organization: {
        columns: {
          stripeAccountId: true,
        },
      },
    },
  });

  console.log(order);

  if (!order) {
    throw new Error("Order not found.");
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      milestoneId: z.string().nullable().optional(),
      currency: z.string().optional(),
      amount: z.number().int().positive(),
      description: z.string().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  if (!order.organization || !order.organization.stripeAccountId) {
    return c.json({ message: "Order does not have a valid organization." }, 400);
  }

  if (!order.userId) {
    return c.json({ message: "Order does not have a valid user." }, 400);
  }

  const customer = await getCustomer(order.userId, order.organization.stripeAccountId);

  const stripeInvoice = await stripe.invoices.create(
    {
      customer: customer.id,
      currency: data.currency,
      description: data.description,
      auto_advance: false, // Keep as draft
      metadata: {
        userId: order.userId,
        orderId: order.id,
        accountId: order.organization.stripeAccountId,
        customerId: customer.id,
        ...(data.milestoneId ? { milestoneId: data.milestoneId } : {}),
        ...(data.description ? { description: data.description } : {}),
      },
    },
    { stripeAccount: order.organization.stripeAccountId },
  );

  const stripeInvoiceItem = await stripe.invoiceItems.create(
    {
      customer: customer.id,
      invoice: stripeInvoice.id!,
      currency: data.currency,
      amount: data.amount,
    },
    { stripeAccount: order.organization.stripeAccountId },
  );

  const [invoice] = await database
    .insert(orderInvoice)
    .values({
      userId: order.userId,
      orderId: orderId,
      milestoneId: data.milestoneId,
      stripeInvoiceId: stripeInvoice.id!,
      stripeAccountId: order.organization.stripeAccountId,
      stripeCustomerId: customer.id,
      status: "draft",
      currency: stripeInvoiceItem.currency,
      amount: stripeInvoiceItem.amount,
      description: data.description,
      url: stripeInvoice.hosted_invoice_url,
    })
    .returning();

  return c.json(invoice);
});

// Get order's invoices
orderInvoices.get("/:orderId/invoices", async (c) => {
  const id = c.req.param("orderId");

  const invoices = await database.query.orderInvoice.findMany({
    where: {
      orderId: id,
    },
  });

  return c.json(invoices);
});

export default orderInvoices;
