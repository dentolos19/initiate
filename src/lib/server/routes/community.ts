import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { communityPostCountExtras } from "#/lib/database/query-fragments.js";
import { communityLike, communityPost } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database, insertEmbedding } from "#/lib/server/integrations/database.js";
import { indexEmbeddings } from "#/lib/server/lib/embeddings.js";
import { safeParseInt } from "#/lib/server/lib/utils.js";

const community = new Hono();

// Get latest posts
community.get("/latest", async (c) => {
  const auth = getAuth(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: {
        createdAt: "desc",
      },
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
    liked: (post.likes?.length ?? 0) > 0,
  }));

  return c.json(posts);
});

// Get popular posts
community.get("/popular", async (c) => {
  const auth = getAuth(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: (post) => desc(sql`(select count(*) from ${communityLike} where ${communityLike.postId} = ${post.id})`),
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
    liked: (post.likes?.length ?? 0) > 0,
  }));

  return c.json(posts);
});

// Create a new post
community.post("/", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      organizationId: z.string().optional(),
      imageUrl: z.string().optional(),
      bannerUrl: z.string().optional(),
      title: z.string(),
      tags: z.string().array().optional(),
      type: z.string().optional().default("general"),
      content: z.string(),
      budget: z.number().positive().optional(),
      deadline: z.string().datetime().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const [createdPost] = await database
    .insert(communityPost)
    .values({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
      userId: auth.userId,
    })
    .returning({ id: communityPost.id });
  const post = await database.query.communityPost.findFirst({
    where: { id: createdPost.id },
    extras: communityPostCountExtras,
    with: {
      user: true,
      organization: true,
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  if (!post) throw new Error("Community post was not found after creation.");

  await indexEmbeddings(
    (vector) => insertEmbedding("communityPost", post!.id, vector),
    post.title,
    post.content,
    post!.tags?.join(", ") ?? "",
  );

  return c.json({
    ...post!,
    comments: post!.commentsCount,
    likes: post!.likesCount,
    liked: (post!.likes?.length ?? 0) > 0,
  });
});

// Update a post
community.put("/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const id = c.req.param("id");

  const existingPost = await database.query.communityPost.findFirst({
    where: {
      id,
    },
    columns: {
      userId: true,
    },
  });

  if (!existingPost) {
    return c.json({ message: "Post not found." }, 404);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      imageUrl: z.string().optional(),
      bannerUrl: z.string().optional(),
      title: z.string(),
      tags: z.string().array().optional(),
      type: z.string().optional(),
      content: z.string(),
      budget: z.number().positive().optional(),
      deadline: z.string().datetime().optional(),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  if (existingPost.userId !== auth.userId) {
    return c.json({ message: "Not allowed." }, 403);
  }

  await database
    .update(communityPost)
    .set({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : null,
    })
    .where(eq(communityPost.id, id));
  const post = await database.query.communityPost.findFirst({
    where: { id },
    extras: communityPostCountExtras,
    with: {
      user: true,
      organization: true,
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  if (!post) throw new Error("Community post was not found after update.");

  await indexEmbeddings(
    (vector) => insertEmbedding("communityPost", post!.id, vector),
    post.title,
    post.content,
    post!.tags?.join(", ") ?? "",
  );

  return c.json({
    ...post!,
    comments: post!.commentsCount,
    likes: post!.likesCount,
    liked: (post!.likes?.length ?? 0) > 0,
  });
});

// Get a post
community.get("/:id", async (c) => {
  const auth = getAuth(c);
  const id = c.req.param("id");

  const post = await database.query.communityPost.findFirst({
    where: {
      id: id,
    },
    extras: communityPostCountExtras,
    with: {
      user: true,
      organization: true,
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  if (!post) {
    return c.json({ message: "Post not found." }, 404);
  }

  return c.json({
    ...post,
    comments: post.commentsCount,
    likes: post.likesCount,
    liked: (post.likes?.length ?? 0) > 0,
  });
});

// Delete a post
community.delete("/:id", async (c) => {
  const auth = getAuth(c);
  const id = c.req.param("id");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const post = await database.query.communityPost.findFirst({
    where: {
      id: id,
    },
    columns: {
      id: true,
      userId: true,
      organizationId: true,
    },
  });

  if (!post) {
    return c.json({ message: "Post not found." }, 404);
  }

  if (post.userId !== auth.userId) {
    return c.json({ message: "Not allowed." }, 403);
  }

  await database.delete(communityPost).where(eq(communityPost.id, id));

  return c.json({ message: "Post deleted successfully." });
});

// Like a post
community.post("/:id/like", async (c) => {
  const auth = getAuth(c);
  const id = c.req.param("id");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const post = await database.query.communityPost.findFirst({
    where: {
      id: id,
    },
    columns: {
      id: true,
    },
  });

  if (!post) {
    return c.json({ message: "Post not found." }, 404);
  }

  const like = await database.query.communityLike.findFirst({
    where: { userId: auth.userId, postId: post.id },
  });

  if (like) {
    return c.json({ message: "Post already liked." }, 400);
  }

  await database.insert(communityLike).values({ userId: auth.userId, postId: post.id });

  return c.json({ message: "Post liked." });
});

// Unlike a post
community.post("/:id/unlike", async (c) => {
  const auth = getAuth(c);
  const id = c.req.param("id");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const post = await database.query.communityPost.findFirst({
    where: {
      id,
    },
    columns: {
      id: true,
    },
  });

  if (!post) {
    return c.json({ message: "Post not found." }, 404);
  }

  const like = await database.query.communityLike.findFirst({
    where: { userId: auth.userId, postId: post.id },
  });

  if (!like) {
    return c.json({ message: "Post not liked yet." }, 400);
  }

  await database.delete(communityLike).where(and(eq(communityLike.userId, auth.userId), eq(communityLike.postId, id)));

  return c.json({ message: "Post unliked." });
});

// Check if a post is liked by the current user
community.get("/:id/liked", async (c) => {
  const auth = getAuth(c);
  const postId = c.req.param("id");

  if (!auth?.userId) {
    return c.json({ liked: false });
  }

  const like = await database.query.communityLike.findFirst({
    where: { userId: auth.userId, postId },
  });

  return c.json({ liked: !!like });
});

// Get all posts by a user
community.get("/user/:userId", async (c) => {
  const auth = getAuth(c);
  const userId = c.req.param("userId");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      where: {
        userId: userId,
      },
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: {
        createdAt: "desc",
      },
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
    liked: (post.likes?.length ?? 0) > 0,
  }));

  return c.json(posts);
});

// Get all posts for an organization
community.get("/organization/:orgId", async (c) => {
  const auth = getAuth(c);
  const orgId = c.req.param("orgId");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      where: {
        organizationId: orgId,
      },
      offset: (page - 1) * limit,
      limit: limit,
      orderBy: {
        createdAt: "desc",
      },
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
    liked: (post.likes?.length ?? 0) > 0,
  }));

  return c.json(posts);
});

export default community;
