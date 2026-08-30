import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import {
  communityPostCountExtras,
  organizationCountExtras,
  serviceCountExtras,
  userCountExtras,
} from "#/lib/database/query-fragments.js";
import { order, user as userTable, userFollow } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database, insertEmbedding, searchRecords } from "#/lib/server/integrations/database.js";
import { indexEmbeddings } from "#/lib/server/lib/embeddings.js";
import { safeParseInt, searchUsers } from "#/lib/server/lib/utils.js";

const users = new Hono();

// Search users
users.get("/search", async (c) => {
  const query = c.req.query("query");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  if (!query) {
    return c.json({ message: "Search query is required." }, 400);
  }

  const result = await searchUsers(c, query, page, limit);
  return c.json(result);
});

// Query users
users.get("/", async (c) => {
  const { database } = c.var.integrations;

  const auth = getAuth(c);
  const query = c.req.query("query");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const users = await database.query.user.findMany({
    extras: userCountExtras,
    offset: (page - 1) * limit,
    limit: limit,
    with: {
      followers: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
    ...(query
      ? {
          where: {
            id: {
              in: (await searchRecords("user", query, 1, 100)).map((row) => row.id),
            },
          },
        }
      : {}),
  });

  return c.json(
    users.map((user) => ({
      ...user,
      followers: user.followersCount,
      following: user.followingsCount,
      isFollowing: user.followers.length > 0,
    })),
  );
});

// Get user
users.get("/:id", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: {
      id,
    },
    with: {
      followers: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  if (!user) return c.json({ message: "User not registered." }, 404);

  return c.json({
    ...user,
    followers: user.followersCount,
    following: user.followingsCount,
    isFollowing: user.followers.length > 0,
  });
});

// Update user
users.put("/:id", async (c) => {
  const auth = getAuth(c);
  if (!auth.userId) {
    return c.json({ message: "Sign in to update your profile." }, 401);
  }

  const requestedId = c.req.param("id");
  if (requestedId !== "current" && requestedId !== auth.userId) {
    return c.json({ message: "You can only update your own profile." }, 403);
  }
  const id = auth.userId;

  const body = await c.req.json();

  const { success, data } = z
    .object({
      bannerUrl: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      prompt: z.string().optional(),
      settings: z.any().optional(),
      tagline: z.string().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  await database.update(userTable).set(data).where(eq(userTable.id, id));
  const user = await database.query.user.findFirst({
    where: { id },
    extras: userCountExtras,
    with: {
      followers: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });
  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  await indexEmbeddings(
    (vector) => insertEmbedding("user", user.id, vector),
    `${user.firstName} ${user.lastName ?? ""}`.trim(),
    user.description,
  );

  return c.json({
    ...user,
    followers: user.followersCount,
    following: user.followingsCount,
    isFollowing: user.followers.length > 0,
  });
});

// Get user's organizations
users.get("/:id/organizations", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: { id },
    columns: { id: true },
  });
  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  const memberships = await database.query.authMember.findMany({ where: { userId: user.id } });

  const organizations = (
    await database.query.organization.findMany({
      where: {
        id: {
          in: memberships.map((membership) => membership.organizationId),
        },
      },
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

// Get user's services
users.get("/:id/services", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: {
      id: id,
    },
    columns: {
      id: true,
    },
  });

  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  const services = (
    await database.query.serviceLike.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      where: {
        userId: user.id,
      },
      with: {
        service: {
          extras: serviceCountExtras,
          with: {
            organization: {
              columns: {
                verified: true,
              },
            },
            plans: {
              where: {
                default: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  ).flatMap((like) => {
    if (!like.service) return [];
    return [
      {
        ...like.service,
        verified: like.service.organization?.verified ?? false,
        plan: like.service.plans[0] ?? null,
        orders: like.service.ordersCount,
        likes: like.service.likesCount,
        isLiked: true,
      },
    ];
  });

  return c.json(services);
});

// Get user's orders
users.get("/:id/orders", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const filter = c.req.query("filter");

  const orders = await database.query.order.findMany({
    where: {
      userId: id,
      ...(filter && z.enum(["pending", "confirmed", "completed"]).safeParse(filter).success ? { status: filter } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    with: {
      service: {
        with: {
          organization: true,
        },
      },
      organization: true,
    },
  });

  return c.json(orders);
});

// Get user's order statistics
users.get("/:id/orders/statistics", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const [totalOrders, pendingOrders, confirmedOrders, completedOrders] = await Promise.all([
    database.$count(order, eq(order.userId, id)),
    database.$count(order, and(eq(order.userId, id), eq(order.status, "pending"))),
    database.$count(order, and(eq(order.userId, id), eq(order.status, "confirmed"))),
    database.$count(order, and(eq(order.userId, id), eq(order.status, "completed"))),
  ]);

  return c.json({
    totalOrders,
    pendingConfirmation: pendingOrders,
    pendingCompletion: confirmedOrders,
    completedOrders,
  });
});

// Get user's community posts
users.get("/:id/posts", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      where: {
        userId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      offset: (page - 1) * limit,
      limit: limit,
      extras: communityPostCountExtras,
      with: {
        user: true,
        organization: true,
        likes: auth?.userId ? { where: { userId: auth.userId } } : false,
      },
    })
  ).map((post) => ({
    ...post,
    comments: post.commentsCount,
    likes: post.likesCount,
    liked: post.likes.length > 0,
  }));

  return c.json(posts);
});

// Get user's proposals
users.get("/:id/proposals", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const proposals = await database.query.communityProposal.findMany({
    where: {
      userId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    offset: (page - 1) * limit,
    limit: limit,
    with: {
      user: true,
      organization: true,
      post: {
        columns: {
          id: true,
          title: true,
        },
      },
    },
  });

  return c.json(proposals);
});

// Get user's invoices
users.get("/:id/invoices", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ message: "Sign in to view invoices." }, 401);

  let id = c.req.param("id");
  if (id === "current") id = auth.userId;
  if (id !== auth.userId) return c.json({ message: "You can only view your own invoices." }, 403);

  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);
  const status = c.req.query("status");

  const invoices = await database.query.orderInvoice.findMany({
    where: {
      userId: id,
      ...(status ? { status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    offset: (page - 1) * limit,
    limit: limit,
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

  return c.json(invoices);
});

// Get user's invoice statistics
users.get("/:id/invoices/statistics", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ message: "Sign in to view invoices." }, 401);

  let id = c.req.param("id");
  if (id === "current") id = auth.userId;
  if (id !== auth.userId) return c.json({ message: "You can only view your own invoices." }, 403);

  const invoiceRows = await database.query.orderInvoice.findMany({
    where: { userId: id },
    columns: { amount: true, status: true },
  });
  const totalInvoices = invoiceRows.length;
  const draftInvoices = invoiceRows.filter((invoice) => invoice.status === "draft").length;
  const openInvoices = invoiceRows.filter((invoice) => invoice.status === "open").length;
  const paidInvoices = invoiceRows.filter((invoice) => invoice.status === "paid").length;
  const refundedInvoices = invoiceRows.filter((invoice) => invoice.status === "refunded").length;
  const totalAmount = invoiceRows.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoiceRows.reduce((sum, invoice) => sum + (invoice.status === "paid" ? invoice.amount : 0), 0);
  const refundedAmount = invoiceRows.reduce(
    (sum, invoice) => sum + (invoice.status === "refunded" ? invoice.amount : 0),
    0,
  );

  return c.json({
    totalInvoices,
    draftInvoices,
    openInvoices,
    paidInvoices,
    refundedInvoices,
    totalAmount,
    paidAmount,
    refundedAmount,
  });
});

// Get user followings
users.get("/:id/followers", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: {
      id: id,
    },
    columns: {
      id: true,
    },
  });

  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  const relations = await database.query.userFollow.findMany({
    where: {
      followId: user.id,
    },
    with: {
      user: true,
    },
    offset: (page - 1) * limit,
    limit: limit,
  });

  return c.json(relations.map((follow) => follow.user));
});

// Get user followers
users.get("/:id/followings", async (c) => {
  const auth = getAuth(c);

  let id = c.req.param("id");
  if (auth?.userId && id === "current") id = auth.userId;

  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: {
      id: id,
    },
    columns: {
      id: true,
    },
  });

  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  const relations = await database.query.userFollow.findMany({
    where: {
      userId: user.id,
    },
    with: {
      follow: true,
    },
    offset: (page - 1) * limit,
    limit: limit,
  });

  return c.json(relations.map((follow) => follow.follow));
});

// Follow user
users.post("/:id/follow", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: {
      id,
    },
  });

  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  if (auth.userId === user.id) {
    return c.json({ message: "You cannot follow yourself." }, 400);
  }

  const follow = await database.query.userFollow.findFirst({
    where: { userId: auth.userId, followId: user.id },
  });

  if (follow) {
    return c.json({ message: "User is already being followed." }, 400);
  }

  await database.insert(userFollow).values({ userId: auth.userId, followId: user.id });

  return c.json({
    ...user,
    followers: user.followersCount + 1,
    following: user.followingsCount,
    isFollowing: true,
  });
});

// Unfollow user
users.post("/:id/unfollow", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");

  const user = await database.query.user.findFirst({
    extras: userCountExtras,
    where: {
      id: id,
    },
  });

  if (!user) {
    return c.json({ message: "User not found." }, 404);
  }

  if (auth.userId === user.id) {
    return c.json({ message: "You cannot unfollow yourself." }, 400);
  }

  const follow = await database.query.userFollow.findFirst({
    where: { userId: auth.userId, followId: user.id },
  });

  if (!follow) {
    return c.json({ message: "User is already not followed." }, 400);
  }

  await database.delete(userFollow).where(and(eq(userFollow.userId, auth.userId), eq(userFollow.followId, user.id)));

  return c.json({
    ...user,
    followers: user.followersCount - 1,
    following: user.followingsCount,
    isFollowing: false,
  });
});

export default users;
