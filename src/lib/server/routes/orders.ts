import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { order as orderTable, orderInvoice } from "#/lib/database/schema.js";
import ServiceCancelledMail from "#/lib/server/components/service-cancelled-mail.js";
import ServiceCompletedMail from "#/lib/server/components/service-completed-mail.js";
import ServiceConfirmedMail from "#/lib/server/components/service-confirmed-mail.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { canChangeOrderStatus, getOrderAccess } from "#/lib/server/lib/order-access.js";

const orders = new Hono();

// Get order
orders.get("/:id", async (c) => {
  const id = c.req.param("id");
  if (!getAuth(c).userId) return c.json({ message: "Please login." }, 401);
  if (!(await getOrderAccess(c, id))) return c.json({ message: "Order not found." }, 404);

  const order = await database.query.order.findFirst({
    where: {
      id: id,
    },
    with: {
      user: true,
      service: {
        with: {
          organization: true,
        },
      },
      plan: true,
      organization: true,
    },
  });

  if (!order) {
    return c.json({ message: "Order not found." }, 404);
  }

  return c.json(order);
});

// Update order
orders.put("/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");
  const authorized = await getOrderAccess(c, id);
  if (!authorized) return c.json({ message: "Order not found." }, 404);
  if (!authorized.access.provider && !authorized.access.admin) return c.json({ message: "Unauthorized." }, 403);

  const body = await c.req.json();

  const { success, data } = z
    .object({
      name: z.string().optional(),
      status: z.string().optional(),
      description: z.string().optional(),
      instructions: z.string().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  if (data.status !== undefined && data.status !== authorized.order.status) {
    return c.json({ message: "Use the order status endpoint to change status." }, 400);
  }
  if (data.name === undefined && data.description === undefined && data.instructions === undefined) {
    return c.json({ message: "No order changes provided." }, 400);
  }

  await database
    .update(orderTable)
    .set({ name: data.name, description: data.description, instructions: data.instructions })
    .where(eq(orderTable.id, id));
  const order = await database.query.order.findFirst({
    where: { id },
    with: {
      user: true,
      organization: true,
      service: {
        with: {
          organization: true,
        },
      },
      plan: true,
    },
  });

  if (!order) {
    return c.json({ message: "Order not found." }, 404);
  }

  return c.json(order);
});

// Update order's status
orders.patch("/:id/status", async (c) => {
  const { notification } = c.var.integrations;

  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");
  const authorized = await getOrderAccess(c, id);
  if (!authorized) return c.json({ message: "Order not found." }, 404);

  const body = await c.req.json();

  const { success, data } = z
    .object({
      status: z.enum(["draft", "pending", "proposed", "confirmed", "completed", "cancelled", "rejected"]),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  if (
    data.status === authorized.order.status ||
    !canChangeOrderStatus(authorized.access, authorized.order.status, data.status)
  ) {
    return c.json({ message: "This order status change is not allowed." }, 403);
  }

  const updated = await database
    .update(orderTable)
    .set(data)
    .where(and(eq(orderTable.id, id), eq(orderTable.status, authorized.order.status)))
    .returning({ id: orderTable.id });
  if (!updated.length) return c.json({ message: "Order changed. Please refresh and try again." }, 409);
  const order = await database.query.order.findFirst({
    where: { id },
    with: {
      user: true,
      organization: true,
      service: {
        with: {
          organization: true,
        },
      },
      plan: true,
    },
  });

  if (!order) {
    return c.json({ message: "Order not found." }, 404);
  }

  if (order.status === "proposal") {
    // TODO: Send notification to buyer
  } else if (order.status === "confirmed") {
    await database
      .update(orderInvoice)
      .set({ status: "open" })
      .where(and(eq(orderInvoice.orderId, order.id), eq(orderInvoice.status, "draft")));

    if (order.user) {
      // Send notification to user
      // TODO: Improve this email
      await notification.queueNotification([order.user.id], {
        title: "Service Confirmed",
        description: `Your service "${order.service?.name ?? "Unknown"}" has been confirmed and will start soon.`,
        content: ServiceConfirmedMail({
          userName: order.user ? `${order.user.firstName} ${order.user.lastName}` : "Unknown",
          serviceName: order.service?.name ?? "Unknown",
          serviceProvider: order.service?.organization?.name ?? "Unknown",
          orderNumber: order.id,
          startDate: new Date().toLocaleDateString(), // Could be more specific if available
          estimatedCompletion: "To be determined", // Could be more specific if available
          providerContact: undefined, // Can be added if available
          nextSteps: "The service provider will contact you shortly with next steps.",
        }),
      });
    }

    if (order.service?.organization) {
      // Send notification to organization
      // TODO: Improve this email
      await notification.queueNotification([order.service.organization.id], {
        title: "Service Order Confirmed",
        description: `A service order for "${order.service.name}" has been confirmed.`,
        content: `A service order has been confirmed by ${order.user ? `${order.user.firstName} ${order.user.lastName ?? ""}`.trim() : "Unknown"} for the service "${order.service.name}". The order ID is ${order.id}. Please prepare to start the service as soon as possible.`,
      });
    }
  } else if (order.status === "completed") {
    if (order.user) {
      // Send notification to user
      // TODO: Improve this email
      await notification.queueNotification([order.user.id], {
        title: "Service Completed",
        description: `Your service "${order.service?.name ?? "Unknown"}" has been completed successfully!`,
        content: ServiceCompletedMail({
          userName: `${order.user.firstName} ${order.user.lastName}`,
          serviceName: order.service?.name ?? "Unknown",
          serviceProvider: order.service?.organization?.name ?? "Unknown",
          orderNumber: order.id,
          completionDate: new Date().toLocaleDateString(),
          deliverables: undefined, // Can be added if available
          reviewLink: undefined, // Can be added if review system is implemented
        }),
      });
    }

    if (order.service?.organization) {
      // Send notification to organization
      // TODO: Improve this email
      await notification.queueNotification([order.service.organization.id], {
        title: "Service Order Completed",
        description: `A service order for "${order.service.name}" has been completed.`,
        content: `A service order has been completed by ${order.user ? `${order.user.firstName} ${order.user.lastName ?? ""}`.trim() : "Unknown"} for the service "${order.service.name}". The order ID is ${order.id}. Please review the deliverables and mark the order as complete in your system.`,
      });
    }
  } else if (order.status === "cancelled") {
    await database
      .update(orderInvoice)
      .set({ status: "void" })
      .where(and(eq(orderInvoice.orderId, order.id), inArray(orderInvoice.status, ["draft", "open"])));

    if (order.user) {
      // Send notification to user
      // TODO: Improve this email
      await notification.queueNotification([order.user.id], {
        title: "Service Order Cancelled",
        description: `Your service order for "${order.service?.name ?? "Unknown"}" has been cancelled.`,
        content: ServiceCancelledMail({
          userName: `${order.user.firstName} ${order.user.lastName}`,
          serviceName: order.service?.name ?? "Unknown",
          orderNumber: order.id,
          cancellationReason: undefined, // Can be added if provided
        }),
      });
    }

    if (order.service?.organization) {
      // Send notification to organization
      // TODO: Improve this email
      await notification.queueNotification([order.service.organization.id], {
        title: "Service Order Cancelled",
        description: `A service order for "${order.service.name}" has been cancelled.`,
        content: `A service order has been cancelled by ${order.user ? `${order.user.firstName} ${order.user.lastName ?? ""}`.trim() : "Unknown"} for the service "${order.service.name}". The order ID is ${order.id}. Please update your records accordingly.`,
      });
    }
  } else if (order.status === "rejected") {
    // TODO: Send notification to buyer
  }

  return c.json(order);
});

export default orders;
