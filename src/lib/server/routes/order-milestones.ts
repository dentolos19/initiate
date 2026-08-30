import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { orderMilestone } from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";
import { getUser } from "#/lib/server/lib/utils.js";

const orderMilestones = new Hono();

// Create a new milestone for an order
orderMilestones.post("/:orderId/milestones", async (c) => {
  const orderId = c.req.param("orderId");

  const user = await getUser(c);
  const body = await c.req.json();

  if (!user) {
    return c.json({ message: "Please login." }, 401);
  }

  const { success, data } = z
    .object({
      name: z.string(),
      content: z.string().optional(),
      status: z.string().default("draft"),
      dueAt: z.string().datetime().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const order = await database.query.order.findFirst({
    where: {
      id: orderId,
    },
    with: {
      service: {
        with: {
          organization: true,
        },
      },
    },
  });

  if (!order) {
    return c.json({ message: "Order not found." }, 404);
  }

  const [createdMilestone] = await database
    .insert(orderMilestone)
    .values({
      orderId,
      name: data.name,
      content: data.content,
      status: data.status,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
    })
    .returning({ id: orderMilestone.id });
  const milestone = await database.query.orderMilestone.findFirst({
    where: { id: createdMilestone.id },
    with: {
      order: true,
      invoices: true,
    },
  });

  return c.json(milestone);
});

// Get all milestones for an order
orderMilestones.get("/:orderId/milestones", async (c) => {
  const orderId = c.req.param("orderId");

  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Please login." }, 401);
  }

  const order = await database.query.order.findFirst({
    where: { id: orderId },
    with: {
      service: {
        with: {
          organization: true,
        },
      },
    },
  });

  if (!order) {
    return c.json({ message: "Order not found." }, 404);
  }

  const milestones = await database.query.orderMilestone.findMany({
    where: {
      orderId,
    },
    orderBy: {
      createdAt: "asc",
    },
    with: {
      invoices: true,
    },
  });

  return c.json(milestones);
});

// Get a specific milestone
orderMilestones.get("/:orderId/milestones/:milestoneId", async (c) => {
  const orderId = c.req.param("orderId");
  const milestoneId = c.req.param("milestoneId");

  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Please login." }, 401);
  }

  const milestone = await database.query.orderMilestone.findFirst({
    where: {
      id: milestoneId,
      orderId: orderId,
    },
    with: {
      order: {
        with: {
          service: {
            with: {
              organization: true,
            },
          },
        },
      },
      invoices: true,
    },
  });

  if (!milestone) {
    return c.json({ message: "Milestone not found." }, 404);
  }

  return c.json(milestone);
});

// Update a milestone
orderMilestones.put("/:orderId/milestones/:milestoneId", async (c) => {
  const orderId = c.req.param("orderId");
  const milestoneId = c.req.param("milestoneId");

  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Please login." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      name: z.string(),
      content: z.string().optional(),
      status: z.string().optional(),
      dueAt: z.string().datetime().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const milestone = await database.query.orderMilestone.findFirst({
    where: {
      id: milestoneId,
      orderId: orderId,
    },
    with: {
      order: {
        with: {
          service: {
            with: {
              organization: true,
            },
          },
        },
      },
    },
  });

  if (!milestone) {
    return c.json({ message: "Milestone not found." }, 404);
  }

  await database
    .update(orderMilestone)
    .set({
      name: data.name,
      content: data.content,
      status: data.status ?? milestone.status,
      dueAt: data.dueAt ? new Date(data.dueAt) : milestone.dueAt,
    })
    .where(eq(orderMilestone.id, milestoneId));
  const updatedMilestone = await database.query.orderMilestone.findFirst({
    where: { id: milestoneId },
    with: {
      order: true,
      invoices: true,
    },
  });

  return c.json(updatedMilestone);
});

// Patch a milestone for status updates
orderMilestones.patch("/:orderId/milestones/:milestoneId", async (c) => {
  const orderId = c.req.param("orderId");
  const milestoneId = c.req.param("milestoneId");

  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Please login." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      status: z.string(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const existingMilestone = await database.query.orderMilestone.findFirst({
    where: {
      id: milestoneId,
      orderId: orderId,
    },
    columns: {
      id: true,
    },
  });

  if (!existingMilestone) {
    return c.json({ message: "Milestone not found." }, 404);
  }

  await database.update(orderMilestone).set({ status: data.status }).where(eq(orderMilestone.id, existingMilestone.id));
  const milestone = await database.query.orderMilestone.findFirst({
    where: { id: existingMilestone.id },
    with: {
      order: true,
      invoices: true,
    },
  });

  return c.json(milestone);
});

// Delete a milestone
orderMilestones.delete("/:orderId/milestones/:milestoneId", async (c) => {
  const orderId = c.req.param("orderId");
  const milestoneId = c.req.param("milestoneId");

  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Please login." }, 401);
  }

  const milestone = await database.query.orderMilestone.findFirst({
    where: {
      id: milestoneId,
      orderId: orderId,
    },
    columns: {
      id: true,
    },
  });

  if (!milestone) {
    return c.json({ message: "Milestone not found." }, 404);
  }

  await database.delete(orderMilestone).where(eq(orderMilestone.id, milestone.id));

  return c.json({ message: "Milestone deleted." });
});

export default orderMilestones;
