import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { organizationCountExtras, serviceCountExtras } from "#/lib/database/query-fragments.js";
import { order, organization as organizationTable, organizationLike } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database, insertEmbedding, searchRecords } from "#/lib/server/integrations/database.js";
import { indexEmbeddings } from "#/lib/server/lib/embeddings.js";
import { checkMembership, getOrganizationId, safeParseInt, searchOrganizations } from "#/lib/server/lib/utils.js";

const organizations = new Hono();

// Search organizations
organizations.get("/search", async (c) => {
  const query = c.req.query("query");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  if (!query) {
    return c.json({ message: "Search query is required." }, 400);
  }

  const result = await searchOrganizations(c, query, page, limit);
  return c.json(result);
});

// Query organizations
organizations.get("/", async (c) => {
  const { database } = c.var.integrations;

  const auth = getAuth(c);
  const query = c.req.query("query");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const organizations = await database.query.organization.findMany({
    offset: (page - 1) * limit,
    limit: limit,
    extras: organizationCountExtras,
    with: {
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
    ...(query
      ? {
          where: {
            id: {
              in: (await searchRecords("organization", query, 1, 100)).map((row) => row.id),
            },
          },
        }
      : {}),
  });

  return c.json(
    organizations.map((organization) => ({
      ...organization,
      likes: organization.likesCount,
      isLiked: organization.likes.length > 0,
    })),
  );
});

// Get popular organizations
organizations.get("/popular", async (c) => {
  const auth = getAuth(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const organizations = (
    await database.query.organization.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: (organization) =>
        desc(
          sql`(select count(*) from ${organizationLike} where ${organizationLike.organizationId} = ${organization.id})`,
        ),
      extras: organizationCountExtras,
      with: {
        likes: auth?.userId ? { where: { userId: auth.userId } } : false,
      },
    })
  ).map((organization) => ({
    ...organization,
    likes: organization.likesCount,
    isLiked: organization.likes.length > 0,
  }));

  return c.json(organizations);
});

// Update organization
organizations.put("/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  let id = c.req.param("id");

  if (id === "current") {
    const organizationId = getOrganizationId(c);
    if (organizationId) id = organizationId;
  }

  const authorized = await checkMembership(auth.userId, id);

  if (!authorized) {
    return c.json({ message: "You are not a member of this organization." }, 403);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      bannerUrl: z.string().optional(),
      location: z.string().optional(),
      tagline: z.string().optional(),
      description: z.string().optional(),
      type: z.string().optional(),
      tags: z.string().array().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  await database.update(organizationTable).set(data).where(eq(organizationTable.id, id));
  const organization = await database.query.organization.findFirst({
    where: { id },
    extras: organizationCountExtras,
    with: {
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  await indexEmbeddings(
    (vector) => insertEmbedding("organization", organization!.id, vector),
    organization!.name,
    organization!.description,
  );

  return c.json({
    ...organization!,
    likes: organization!.likesCount,
    isLiked: organization!.likes.length > 0,
  });
});

// Get organization
organizations.get("/:id", async (c) => {
  let id = c.req.param("id");

  if (id === "current") {
    const organizationId = getOrganizationId(c);
    if (organizationId) id = organizationId;
  }

  const auth = getAuth(c);

  const organization = await database.query.organization.findFirst({
    where: {
      id,
    },
    extras: organizationCountExtras,
    with: {
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  if (!organization) return c.json({ message: "Organization not registered." }, 404);

  return c.json({
    ...organization,
    likes: organization.likesCount,
    isLiked: organization.likes.length > 0,
  });
});

// Get organization's services
organizations.get("/:id/services", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  let id = c.req.param("id");

  if (id === "current") {
    const organizationId = getOrganizationId(c);
    if (organizationId) id = organizationId;
  }

  const services = (
    await database.query.service.findMany({
      where: {
        organizationId: id,
      },
      extras: serviceCountExtras,
      with: {
        organization: {
          columns: {
            verified: true,
          },
        },
        likes: {
          where: {
            userId: auth.userId,
          },
        },
        plans: {
          where: {
            default: true,
          },
          limit: 1,
        },
      },
    })
  ).map((service) => ({
    ...service,
    verified: service.organization?.verified ?? false,
    plan: service.plans[0] ?? null,
    orders: service.ordersCount,
    likes: service.likesCount,
    isLiked: service.likes.length > 0,
  }));

  return c.json(services);
});

// Get organization's orders
organizations.get("/:id/orders", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  let id = c.req.param("id");

  if (id === "current") {
    const organizationId = getOrganizationId(c);
    if (organizationId) id = organizationId;
  }

  const authorized = await checkMembership(auth.userId, id);

  if (!authorized) {
    return c.json({ message: "You are not a member of this organization." }, 403);
  }

  const filterValue = c.req.query("filter");
  const filter = z.enum(["pending", "confirmed", "completed"]).safeParse(filterValue).success ? filterValue : undefined;

  const orders = await database.query.order.findMany({
    where: {
      organizationId: id, // Use direct organizationId field for better performance
      ...(filter ? { status: filter } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    with: {
      service: true,
      user: true,
      organization: true,
    },
  });

  return c.json(orders);
});

// Get organization's order statistics
organizations.get("/:id/orders/statistics", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  let id = c.req.param("id");

  if (id === "current") {
    const organizationId = getOrganizationId(c);
    if (organizationId) id = organizationId;
  }

  const authorized = await checkMembership(auth.userId, id);

  if (!authorized) {
    return c.json({ message: "You are not a member of this organization." }, 403);
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalOrders, pendingConfirmation, pendingCompletion, completedOrders] = await Promise.all([
    database.$count(order, eq(order.organizationId, id)),
    database.$count(order, and(eq(order.organizationId, id), eq(order.status, "pending"))),
    database.$count(order, and(eq(order.organizationId, id), eq(order.status, "confirmed"))),
    database.$count(order, and(eq(order.organizationId, id), eq(order.status, "completed"))),
  ]);

  return c.json({
    totalOrders,
    pendingConfirmation,
    pendingCompletion,
    completedOrders,
  });
});

// Like organization
organizations.post("/:id/like", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");

  const organization = await database.query.organization.findFirst({
    where: {
      id: id,
    },
    extras: organizationCountExtras,
  });

  if (!organization) {
    return c.json({ message: "Organization not found." }, 404);
  }

  const likeExists = !!(await database.query.organizationLike.findFirst({
    where: { userId: auth.userId, organizationId: id },
  }));

  if (likeExists) {
    return c.json({ message: "You have already liked this organization." }, 400);
  }

  await database.insert(organizationLike).values({ organizationId: id, userId: auth.userId });

  return c.json({
    ...organization,
    likes: organization.likesCount + 1,
    isLiked: true,
  });
});

// Unlike organization
organizations.post("/:id/unlike", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");

  const organization = await database.query.organization.findFirst({
    where: {
      id: id,
    },
    extras: organizationCountExtras,
  });

  if (!organization) {
    return c.json({ message: "Organization not found." }, 404);
  }

  const likeExists = await database.query.organizationLike.findFirst({
    where: { userId: auth.userId, organizationId: id },
  });

  if (!likeExists) {
    return c.json({ message: "You have not liked this organization." }, 400);
  }

  await database
    .delete(organizationLike)
    .where(and(eq(organizationLike.userId, auth.userId), eq(organizationLike.organizationId, id)));

  return c.json({
    ...organization,
    likes: organization.likesCount - 1,
    isLiked: false,
  });
});

export default organizations;
