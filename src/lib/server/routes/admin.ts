import { Hono } from "hono";

import { organization, service, user } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";

const admin = new Hono<{ Bindings: Env }>();

// Setup middleware
admin.use("*", async (c, next) => {
  const { database } = c.var.integrations;

  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const user = await database.query.user.findFirst({
    where: {
      id: auth.userId,
    },
    columns: {
      type: true,
    },
  });

  if (user?.type !== "admin") {
    return c.json({ message: "Not allowed." }, 403);
  }

  await next();
});

// Get plaform statistics
admin.get("/statistics", async (c) => {
  const { database } = c.var.integrations;

  const [usersCount, organizationsCount, servicesCount] = await Promise.all([
    database.$count(user),
    database.$count(organization),
    database.$count(service),
  ]);

  return c.json({
    counts: {
      users: usersCount,
      organizations: organizationsCount,
      services: servicesCount,
    },
  });
});

// Synchronize embeddings
admin.post("/synchronize", async (c) => {
  const instance = await c.env.SYNCHRONIZER.create();
  return c.json({
    id: instance.id,
    details: instance.status(),
  });
});

export default admin;
