import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { notification as notificationTable, organizationNotification } from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";

const notifications = new Hono();

// Create a notification for an audience
notifications.post("/", async (c) => {
  const { notification } = c.var.integrations;

  const body = await c.req.json();

  const { success, data } = z
    .object({
      audience: z.string().array(),
      data: z.object({
        title: z.string(),
        description: z.string().optional(),
        content: z.string().optional(),
      }),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  await notification.sendNotification(data.audience, data.data);

  return c.json({ message: "Notification sent." });
});

// Get notifications for the current user
notifications.get("/", async (c) => {
  const context = c.req.query("context");
  const filter = c.req.query("filter");

  if (context === "organization") {
    const organizationId = c.var.auth?.orgId;

    if (!organizationId) {
      throw new Error("You must be part of an organization.");
    }

    const notifications = await database.query.organizationNotification.findMany({
      where: {
        organizationId,
        ...(filter === "inbox" && { isArchived: false }),
        ...(filter === "archived" && { isArchived: true }),
        ...(filter !== "all" && filter !== "inbox" && filter !== "archived" && { isRead: true, isArchived: false }),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json(notifications);
  }

  const userId = c.var.auth?.userId;

  if (!userId) {
    throw new Error("You must be authenticated to view notifications.");
  }

  const notifications = await database.query.notification.findMany({
    where: {
      userId,
      ...(filter === "inbox" && { isArchived: false }),
      ...(filter === "archived" && { isArchived: true }),
      ...(filter !== "all" && filter !== "inbox" && filter !== "archived" && { isRead: true, isArchived: false }),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json(notifications);
});

// Archive a notification
notifications.patch("/:notificationId/archive", async (c) => {
  const notificationId = c.req.param("notificationId");
  const context = c.req.query("context");

  if (context === "organization") {
    const organizationId = c.var.auth?.orgId;

    if (!organizationId) {
      throw new Error("You must be part of an organization.");
    }

    await database
      .update(organizationNotification)
      .set({ isArchived: true })
      .where(
        and(
          eq(organizationNotification.id, notificationId),
          eq(organizationNotification.organizationId, organizationId),
        ),
      );

    return c.json({ message: "Notification archived." });
  }

  const userId = c.var.auth?.userId;

  if (!userId) {
    throw new Error("You must be authenticated to archive notifications.");
  }

  await database
    .update(notificationTable)
    .set({ isArchived: true })
    .where(and(eq(notificationTable.id, notificationId), eq(notificationTable.userId, userId)));

  return c.json({ message: "Notification archived." });
});

// Unarchive a notification
notifications.patch("/:notificationId/unarchive", async (c) => {
  const notificationId = c.req.param("notificationId");
  const context = c.req.query("context");

  if (context === "organization") {
    const organizationId = c.var.auth?.orgId;

    if (!organizationId) {
      throw new Error("You must be part of an organization.");
    }

    await database
      .update(organizationNotification)
      .set({ isArchived: false })
      .where(
        and(
          eq(organizationNotification.id, notificationId),
          eq(organizationNotification.organizationId, organizationId),
        ),
      );

    return c.json({ message: "Notification unarchived." });
  }

  const userId = c.var.auth?.userId;

  if (!userId) {
    throw new Error("You must be authenticated to unarchive notifications.");
  }

  await database
    .update(notificationTable)
    .set({ isArchived: false })
    .where(and(eq(notificationTable.id, notificationId), eq(notificationTable.userId, userId)));

  return c.json({ message: "Notification unarchived." });
});

export default notifications;
