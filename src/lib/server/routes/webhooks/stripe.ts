import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { orderInvoice } from "#/lib/database/schema.js";
import BasicMail from "#/lib/server/components/basic-mail.js";
import InvoicePaidMail from "#/lib/server/components/invoice-paid-mail.js";
import { STRIPE_WEBHOOK_SECRET } from "#/lib/server/environment.js";
import { stripe } from "#/lib/server/integrations.js";
import { database } from "#/lib/server/integrations/database.js";

const stripeWebhook = new Hono();

stripeWebhook.post("/", async (c) => {
  const { notification } = c.var.integrations;

  try {
    const stripeSignature = c.req.header("Stripe-Signature") as string;
    const stripeAccount = c.req.header("Stripe-Account") as string;
    const rawBody = await c.req.arrayBuffer();

    const event = await stripe.webhooks.constructEventAsync(
      Buffer.from(rawBody),
      stripeSignature,
      STRIPE_WEBHOOK_SECRET,
    );

    switch (event.type) {
      case "invoice.created": {
        const stripeInvoice = event.data.object;

        const userId = stripeInvoice.metadata?.userId as string;
        const orderId = stripeInvoice.metadata?.orderId as string;
        const milestoneId = stripeInvoice.metadata?.milestoneId as string | undefined;
        const description = stripeInvoice.metadata?.description as string | undefined;

        const accountId = stripeAccount || (stripeInvoice.metadata?.accountId as string);
        const customerId = stripeInvoice.customer as string;

        const existingInvoice = await database.query.orderInvoice.findFirst({
          where: {
            stripeInvoiceId: stripeInvoice.id!,
          },
          columns: {
            id: true,
          },
        });

        if (existingInvoice) {
          await database
            .update(orderInvoice)
            .set({
              milestoneId: milestoneId,
              status: stripeInvoice.status!,
              currency: stripeInvoice.currency,
              amount: stripeInvoice.total,
              description: description,
              url: stripeInvoice.hosted_invoice_url,
              dueAt: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
              paidAt: stripeInvoice.status === "paid" ? new Date() : null,

              stripeAccountId: accountId,
              stripeCustomerId: customerId,
              stripeInvoiceId: stripeInvoice.id!,
            })
            .where(eq(orderInvoice.id, existingInvoice.id));
        } else {
          await database.insert(orderInvoice).values({
            userId: userId,
            orderId: orderId,
            milestoneId: milestoneId,
            status: stripeInvoice.status!,
            currency: stripeInvoice.currency,
            amount: stripeInvoice.total,
            description: description,
            url: stripeInvoice.hosted_invoice_url,

            stripeAccountId: accountId,
            stripeCustomerId: customerId,
            stripeInvoiceId: stripeInvoice.id!,
          });
        }

        return c.json({ message: "Invoice created.", received: true });
      }

      case "invoice.updated": {
        const stripeInvoice = event.data.object;

        const milestoneId = stripeInvoice.metadata?.milestoneId as string | undefined;
        const description = stripeInvoice.metadata?.description as string | undefined;

        const existingInvoice = await database.query.orderInvoice.findFirst({
          where: {
            stripeInvoiceId: stripeInvoice.id!,
          },
          columns: {
            id: true,
          },
        });

        if (!existingInvoice) {
          return c.json({ message: "Invoice not found.", received: true }, 404);
        }

        await database
          .update(orderInvoice)
          .set({
            milestoneId: milestoneId,
            status: stripeInvoice.status!,
            currency: stripeInvoice.currency,
            amount: stripeInvoice.total,
            description: description,
            url: stripeInvoice.hosted_invoice_url,
            dueAt: stripeInvoice.due_date ? new Date(stripeInvoice.due_date * 1000) : null,
            paidAt: stripeInvoice.status === "paid" ? new Date() : null,
          })
          .where(eq(orderInvoice.id, existingInvoice.id));
        const invoice = await database.query.orderInvoice.findFirst({
          where: { id: existingInvoice.id },
          with: {
            user: true,
            order: {
              with: {
                service: true,
              },
            },
          },
        });

        if (!invoice) {
          return c.json({ message: "Invoice not found after update.", received: true }, 404);
        }

        if (stripeInvoice.status === "paid") {
          // TODO: Improve notification system

          // Send notification to user
          if (invoice.userId) {
            await notification.queueNotification([invoice.userId], {
              title: "Payment Received your Service Order",
              description: `Your payment for "${invoice.order?.service?.name ?? "Unknown"}" has been processed successfully.`,
              content: InvoicePaidMail({
                userName: invoice.user ? `${invoice.user.firstName} ${invoice.user.lastName ?? ""}`.trim() : "Unknown",
                invoiceNumber: stripeInvoice.number || stripeInvoice.id!,
                amount: ((stripeInvoice.total || 0) / 100).toFixed(2),
                paymentDate: new Date().toLocaleDateString(),
                paymentMethod: "Credit Card", // Could be more specific if available
                serviceName: invoice.order?.service?.name,
                transactionId: (stripeInvoice as any).payment_intent || undefined,
                receiptUrl: (stripeInvoice as any).receipt_url || undefined,
              }),
            });
          }

          // Send notification to organization
          if (invoice.order?.service) {
            await notification.queueNotification([invoice.order.service.organizationId], {
              title: "Payment Received for Service Order",
              description: `A payment has been received for the service order "${invoice.order.service.name}".`,
              content: BasicMail({
                title: "Payment Received for Service Order",
                content: `A payment of ${((stripeInvoice.total || 0) / 100).toFixed(2)} has been received for the service order "${invoice.order.service.name}".`,
              }),
            });
          }
        }

        return c.json({ message: "Invoice updated.", received: true });
      }

      case "invoice.deleted": {
        const stripeInvoice = event.data.object;

        const invoice = await database.query.orderInvoice.findFirst({
          where: {
            stripeInvoiceId: stripeInvoice.id!,
          },
          columns: {
            id: true,
          },
        });

        if (invoice) {
          await database.update(orderInvoice).set({ status: "void" }).where(eq(orderInvoice.id, invoice.id));
        }

        return c.json({ message: "Invoice deleted.", received: true });
      }
    }

    return c.json({ message: "Webhook not handled.", received: true });
  } catch (error) {
    if (error instanceof Error) {
      console.error("Unable to handle webhook.", error.message);
      c.var.sentry.captureException(error);
      return c.json({ message: error.message }, 400);
    }
    return c.json({ message: "Unable to handle webhook." }, 400);
  }
});

export default stripeWebhook;
