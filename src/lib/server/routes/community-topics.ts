import { and, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";

import { communityPostCountExtras } from "#/lib/database/query-fragments.js";
import { communityFollow, communityLike } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { safeParseInt } from "#/lib/server/lib/utils.js";

const communityTopics = new Hono();

// Get most commonly used tags (topics) used in posts
communityTopics.get("/topics", async (c) => {
  const postsWithTagsForNames = await database.query.communityPost.findMany({
    where: {
      RAW: (post) => sql`json_array_length(${post.tags}) > 0`,
    },
    columns: {
      tags: true,
    },
  });

  const tagCountsForNames = new Map<string, number>();

  postsWithTagsForNames.forEach((post) => {
    post.tags?.forEach((tag) => {
      tagCountsForNames.set(tag, (tagCountsForNames.get(tag) || 0) + 1);
    });
  });

  const topTagNames = Array.from(tagCountsForNames.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag);

  return c.json(topTagNames);
});

// Get all posts by tag
communityTopics.get("/topic/:topic", async (c) => {
  const auth = getAuth(c);
  const topic = c.req.param("topic");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      where: {
        RAW: (post) => sql`exists (select 1 from json_each(${post.tags}) where value = ${topic})`,
      },
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

// Follow a topic
communityTopics.post("/topic/:tag/follow", async (c) => {
  const auth = getAuth(c);
  const tag = c.req.param("tag");

  if (!auth?.userId) return c.json({ message: "Unauthorized." }, 401);

  try {
    // check if already following
    const existingFollow = await database.query.communityFollow.findFirst({
      where: { userId: auth.userId, tag },
    });

    if (existingFollow) {
      return c.json({ message: `Already following topic: ${tag}` }, 400);
    }

    await database.insert(communityFollow).values({ userId: auth.userId, tag });

    return c.json({ message: `Followed topic: ${tag}` });
  } catch (error) {
    console.error("Error following topic:", error);
    return c.json({ message: "Failed to follow topic." }, 500);
  }
});

// Unfollow a topic
communityTopics.post("/topic/:tag/unfollow", async (c) => {
  const auth = getAuth(c);
  const tag = c.req.param("tag");

  if (!auth?.userId) return c.json({ message: "Unauthorized." }, 401);

  // check if following
  const existingFollow = await database.query.communityFollow.findFirst({
    where: { userId: auth.userId, tag },
  });

  if (!existingFollow) {
    return c.json({ message: `Not following topic: ${tag}` }, 400);
  }

  await database
    .delete(communityFollow)
    .where(and(eq(communityFollow.userId, auth.userId), eq(communityFollow.tag, tag)));

  return c.json({ message: `Unfollowed topic: ${tag}` });
});

// Get followed topics for the current user
communityTopics.get("/me/following", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) return c.json({ message: "Unauthorized." }, 401);

  const followedTags = await database.query.communityFollow.findMany({
    where: { userId: auth.userId },
    columns: { tag: true },
  });

  const tags = followedTags.map((ft) => ft.tag);

  return c.json(tags);
});

// Get posts from followed topics only
communityTopics.get("/feed/following", async (c) => {
  const auth = getAuth(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  // get user's followed tags
  const followedTags = await database.query.communityFollow.findMany({
    where: { userId: auth.userId },
    columns: { tag: true },
  });

  const tagsList = followedTags.map((ft) => ft.tag);

  if (tagsList.length === 0) {
    return c.json([]);
  }

  const posts = (
    await database.query.communityPost.findMany({
      where: {
        RAW: (post) =>
          sql`exists (select 1 from json_each(${post.tags}) where value in (${sql.join(
            tagsList.map((tag) => sql`${tag}`),
            sql`, `,
          )}))`,
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
        likes: {
          where: {
            userId: auth.userId,
          },
        },
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

// Check if a topic is followed by the current user
communityTopics.get("/topic/:tag/following-status", async (c) => {
  const auth = getAuth(c);
  const tag = c.req.param("tag");

  if (!auth?.userId) {
    return c.json({ following: false });
  }

  const followedTag = await database.query.communityFollow.findFirst({
    where: { userId: auth.userId, tag },
  });

  return c.json({ following: !!followedTag });
});

export default communityTopics;
