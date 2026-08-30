import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { serviceCountExtras } from "#/lib/database/query-fragments.js";
import { service as serviceTable, serviceLike } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database, insertEmbedding, searchEmbeddings, searchRecords } from "#/lib/server/integrations/database.js";
import { aggregateEmbeddings, generateEmbeddings, indexEmbeddings } from "#/lib/server/lib/embeddings.js";
import { createPaymentReference } from "#/lib/server/lib/payments.js";
import { getOrganization, getUser, safeParseInt, searchServices } from "#/lib/server/lib/utils.js";

const services = new Hono();
const serviceTypeSchema = z.enum(["api", "mcp", "saas", "other"]);

async function getPopularServices(userId: string | undefined, page: number, limit: number) {
  return (
    await database.query.service.findMany({
      extras: serviceCountExtras,
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: (service) =>
        desc(sql`(select count(*) from ${serviceLike} where ${serviceLike.serviceId} = ${service.id})`),
      where: {
        status: "published",
      },
      with: {
        organization: {
          columns: {
            verified: true,
          },
        },
        likes: userId
          ? {
              where: {
                userId,
              },
            }
          : false,
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
    isLiked: (service.likes?.length ?? 0) > 0,
  }));
}

// Search services
services.get("/search", async (c) => {
  const query = c.req.query("query");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  if (!query) {
    return c.json({ message: "Search query is required." }, 400);
  }

  const result = await searchServices(c, query, page, limit);
  return c.json(result);
});

// Query services
services.get("/", async (c) => {
  const { database } = c.var.integrations;

  const auth = getAuth(c);
  const query = c.req.query("query");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const services = await database.query.service.findMany({
    extras: serviceCountExtras,
    offset: (page - 1) * limit,
    limit: limit,
    where: {
      status: "published",
      ...(query
        ? {
            id: {
              in: (await searchRecords("service", query, 1, 100)).map((row) => row.id),
            },
          }
        : {}),
    },
    with: {
      organization: {
        columns: {
          verified: true,
        },
      },
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
      plans: {
        where: {
          default: true,
        },
        limit: 1,
      },
    },
  });

  return c.json(
    services.map((service) => ({
      ...service,
      verified: service.organization?.verified ?? false,
      plan: service.plans[0] ?? null,
      orders: service.ordersCount,
      likes: service.likesCount,
      isLiked: service.likes.length > 0,
    })),
  );
});

// Get latest services
services.get("/latest", async (c) => {
  const user = await getUser(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const services = (
    await database.query.service.findMany({
      extras: serviceCountExtras,
      offset: (page - 1) * limit,
      limit: limit,
      where: {
        status: "published",
      },
      orderBy: {
        createdAt: "desc",
      },
      with: {
        organization: {
          columns: {
            verified: true,
          },
        },
        likes: user ? { where: { userId: user.id } } : false,
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

// Get popular services
services.get("/popular", async (c) => {
  const user = await getUser(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  return c.json(await getPopularServices(user?.id, page, limit));
});

// Get relevant services
services.get("/relevant", async (c) => {
  const user = await getUser(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  if (!user || !user.prompt) {
    return c.json(await getPopularServices(user?.id, page, limit));
  }

  const embeddings = await generateEmbeddings(user.prompt);
  const aggregate = await aggregateEmbeddings(embeddings);
  const similarities = await searchEmbeddings("service", aggregate.vector, page, limit);

  const services = await database.query.service.findMany({
    extras: serviceCountExtras,
    where: {
      id: {
        in: similarities.map((item) => item.id),
      },
      status: "published",
    },
    with: {
      organization: {
        columns: {
          verified: true,
        },
      },
      likes: {
        where: {
          userId: user.id,
        },
      },
      plans: {
        where: {
          default: true,
        },
      },
    },
  });

  const combinedServices = similarities
    .map((item) => {
      const service = services.find((service) => service.id === item.id);
      if (!service) return null;

      return {
        ...service,
        verified: service.organization?.verified ?? false,
        plan: service.plans[0] ?? null,
        orders: service.ordersCount,
        likes: service.likesCount,
        isLiked: service.likes.length > 0,
        similarity: item.similarity,
      };
    })
    .filter((item) => !!item);

  return c.json(combinedServices);
});

// Create service
services.post("/", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user || !organization) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      imageUrl: z.string().optional(),
      bannerUrl: z.string().optional(),
      name: z.string(),
      type: serviceTypeSchema.default("other"),
      status: z.string().optional(),
      description: z.string().optional(),
      tagline: z.string().optional(),
      tags: z.string().array().default([]),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const [service] = await database
    .insert(serviceTable)
    .values({
      ...data,
      organizationId: organization.id,
      productReference: createPaymentReference("product"),
    })
    .returning();

  await indexEmbeddings(
    (vector) => insertEmbedding("service", service.id, vector),
    service.name,
    service.tagline,
    service.description,
  );

  return c.json({
    ...service,
    verified: organization.verified,
  });
});

// Update service
services.put("/:id", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user || !organization) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const id = c.req.param("id");
  const body = await c.req.json();

  const { success, data } = z
    .object({
      imageUrl: z.string().optional(),
      bannerUrl: z.string().optional(),
      name: z.string().optional(),
      type: serviceTypeSchema.optional(),
      status: z.string().optional(),
      description: z.string().optional(),
      tagline: z.string().optional(),
      tags: z.string().array().default([]),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const existingService = await database.query.service.findFirst({
    extras: serviceCountExtras,
    where: {
      id: id,
    },
    columns: {
      id: true,
      organizationId: true,
      productReference: true,
    },
  });

  if (!existingService) {
    return c.json({ message: "Service not found." }, 404);
  }

  if (existingService.organizationId !== organization.id) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  await database.update(serviceTable).set(data).where(eq(serviceTable.id, id));
  let service = await database.query.service.findFirst({
    where: { id },
    extras: serviceCountExtras,
    with: {
      organization: {
        columns: {
          verified: true,
        },
      },
      likes: {
        where: {
          userId: user.id,
        },
      },
      plans: {
        where: {
          default: true,
        },
      },
    },
  });

  if (!service) {
    return c.json({ message: "Service not found after update." }, 404);
  }

  await indexEmbeddings(
    (vector) => insertEmbedding("service", service.id, vector),
    service.name,
    service.tagline,
    service.description,
  );

  return c.json({
    ...service,
    verified: service.organization?.verified ?? false,
    plan: service.plans[0] ?? null,
    orders: service.ordersCount,
    likes: service.likesCount,
    isLiked: service.likes.length > 0,
  });
});

// Get service
services.get("/:id", async (c) => {
  const user = await getUser(c);
  const id = c.req.param("id");

  const service = await database.query.service.findFirst({
    extras: serviceCountExtras,
    where: {
      id,
    },
    with: {
      organization: {
        columns: {
          verified: true,
        },
      },
      likes: user ? { where: { userId: user.id } } : false,
      plans: {
        where: {
          default: true,
        },
      },
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  return c.json({
    ...service,
    verified: service.organization?.verified ?? false,
    plan: service.plans[0] ?? null,
    orders: service.ordersCount,
    likes: service.likesCount,
    isLiked: service.likes.length > 0,
  });
});

// Delete service
services.delete("/:id", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user || !organization) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const id = c.req.param("id");

  const existingService = await database.query.service.findFirst({
    extras: serviceCountExtras,
    where: {
      id,
    },
    columns: {
      organizationId: true,
      productReference: true,
    },
  });

  if (!existingService) {
    return c.json({ message: "Service not found." }, 404);
  }

  if (existingService.organizationId !== organization.id) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  await database.delete(serviceTable).where(eq(serviceTable.id, id));

  return c.json({ message: "Service deleted." });
});

// Get service's orders
services.get("/:id/orders", async (c) => {
  const id = c.req.param("id");

  const orders = await database.query.order.findMany({
    where: {
      serviceId: id,
    },
    with: {
      user: true,
      service: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json(orders);
});

// Get similar services
services.get("/:id/similar", async (c) => {
  const id = c.req.param("id");

  const service = await database.query.service.findFirst({
    extras: serviceCountExtras,
    where: {
      id,
    },
    columns: {
      name: true,
      description: true,
      tagline: true,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  const user = await getUser(c);
  let similarities: Awaited<ReturnType<typeof searchEmbeddings>>;

  try {
    const embeddings = await generateEmbeddings(service.name, service.tagline, service.description);
    const aggregate = await aggregateEmbeddings(embeddings);
    similarities = await searchEmbeddings("service", aggregate.vector);
  } catch {
    const fallback = await getPopularServices(user?.id, 1, 10);
    return c.json(fallback.filter((item) => item.id !== id));
  }

  const services = await database.query.service.findMany({
    extras: serviceCountExtras,
    where: {
      id: {
        in: similarities.map((item) => item.id),
      },
      status: "published",
    },
    with: {
      organization: {
        columns: {
          verified: true,
        },
      },
      likes: user ? { where: { userId: user.id } } : false,
      plans: {
        where: {
          default: true,
        },
        limit: 1,
      },
    },
  });

  return c.json(
    similarities
      .map((item) => {
        const service = services.find((service) => service.id === item.id);
        if (!service) return null;

        return {
          ...service,
          verified: service.organization?.verified ?? false,
          plan: service.plans[0] ?? null,
          orders: service.ordersCount,
          likes: service.likesCount,
          isLiked: service.likes.length > 0,
          similarity: item.similarity,
        };
      })
      .filter((item) => !!item),
  );
});

// Like service
services.post("/:id/like", async (c) => {
  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const id = c.req.param("id");

  const service = await database.query.service.findFirst({
    extras: serviceCountExtras,
    where: {
      id,
    },
    columns: {
      id: true,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  const like = await database.query.serviceLike.findFirst({
    where: { userId: user.id, serviceId: service.id },
  });

  if (like) {
    return c.json({ message: "Service already liked." }, 400);
  }

  await database.insert(serviceLike).values({ userId: user.id, serviceId: id });

  return c.json({ message: "Service liked." });
});

// Unlike service
services.post("/:id/unlike", async (c) => {
  const user = await getUser(c);

  if (!user) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const id = c.req.param("id");

  const service = await database.query.service.findFirst({
    extras: serviceCountExtras,
    where: {
      id,
    },
    columns: {
      id: true,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  const like = await database.query.serviceLike.findFirst({
    where: { userId: user.id, serviceId: service.id },
  });

  if (!like) {
    return c.json({ message: "Service not liked." }, 400);
  }

  await database.delete(serviceLike).where(and(eq(serviceLike.userId, user.id), eq(serviceLike.serviceId, service.id)));

  return c.json({ message: "Service unliked." });
});

export default services;
