import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { communityComment } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";

const communityComments = new Hono();

// Create a comment on a post
communityComments.post("/:id/comments", async (c) => {
  const auth = getAuth(c);
  const postId = c.req.param("id");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const body = await c.req.json();
  const { success, data } = z
    .object({
      content: z.string().min(1),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid body." }, 400);
  }

  const post = await database.query.communityPost.findFirst({
    where: { id: postId },
    columns: { id: true },
  });

  if (!post) {
    return c.json({ message: "Post not found." }, 404);
  }

  const [createdComment] = await database
    .insert(communityComment)
    .values({
      content: data.content,
      postId: post.id,
      userId: auth.userId,
      parentId: null,
    })
    .returning({ id: communityComment.id });
  const comment = await database.query.communityComment.findFirst({
    where: { id: createdComment.id },
    with: { user: true },
  });

  return c.json(comment);
});

// Create a reply to a comment
communityComments.post("/:id/comments/:commentId/reply", async (c) => {
  const auth = getAuth(c);
  const postId = c.req.param("id");
  const commentId = c.req.param("commentId");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const body = await c.req.json();
  const { success, data } = z
    .object({
      content: z.string().min(1),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid body." }, 400);
  }

  const post = await database.query.communityPost.findFirst({
    where: { id: postId },
    columns: { id: true },
  });

  if (!post) {
    return c.json({ message: "Post not found." }, 404);
  }

  const comment = await database.query.communityComment.findFirst({
    where: { id: commentId },
    columns: { id: true, postId: true },
  });

  if (!comment) {
    return c.json({ message: "Comment not found." }, 404);
  }

  const [createdReply] = await database
    .insert(communityComment)
    .values({
      content: data.content,
      postId: post.id,
      userId: auth.userId,
      parentId: comment.id,
    })
    .returning({ id: communityComment.id });
  const reply = await database.query.communityComment.findFirst({
    where: { id: createdReply.id },
    with: { user: true },
  });

  return c.json(reply);
});

// Get all comments for a post
communityComments.get("/:id/comments/thread", async (c) => {
  const postId = c.req.param("id");

  try {
    const comments = await database.query.communityComment.findMany({
      where: {
        postId: postId,
      },
      with: {
        user: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const commentsById = new Map<string, any>();
    for (const comment of comments as any[]) {
      commentsById.set(comment.id, {
        ...comment,
        replyingTo: null,
        replies: [],
      });
    }
    const parentComments: any[] = [];

    for (const comment of commentsById.values()) {
      const parent = comment.parentId ? commentsById.get(comment.parentId) : undefined;
      if (parent) {
        comment.replyingTo = parent.user;
        parent.replies.push(comment);
      } else {
        parentComments.push(comment);
      }
    }

    parentComments.reverse();

    return c.json({
      comments: parentComments,
      totalCount: comments.length,
    });
  } catch (error) {
    console.error("Error fetching comment threads:", error);
    return c.json(
      {
        success: false,
        error: "Failed to fetch comments",
      },
      500,
    );
  }
});

// Update a comment
communityComments.put("/comments/:commentId", async (c) => {
  const auth = getAuth(c);
  const commentId = c.req.param("commentId");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const body = await c.req.json();
  const { success, data } = z
    .object({
      content: z.string().min(1),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid content." }, 400);
  }

  const existingComment = await database.query.communityComment.findFirst({
    where: { id: commentId },
    columns: { userId: true },
  });

  if (!existingComment) {
    return c.json({ message: "Comment not found." }, 404);
  }

  if (existingComment.userId !== auth.userId) {
    return c.json({ message: "Not allowed to edit this comment." }, 403);
  }

  await database.update(communityComment).set({ content: data.content }).where(eq(communityComment.id, commentId));
  const updatedComment = await database.query.communityComment.findFirst({
    where: { id: commentId },
    with: { user: true },
  });

  return c.json(updatedComment);
});

// Delete a comment
communityComments.delete("/:id/comments/:commentId", async (c) => {
  const auth = getAuth(c);
  const commentId = c.req.param("commentId");

  if (!auth?.userId) {
    return c.json({ message: "Unauthorized." }, 401);
  }

  const comment = await database.query.communityComment.findFirst({
    where: { id: commentId },
    columns: {
      id: true,
      userId: true,
    },
  });

  if (!comment) {
    return c.json({ message: "Comment not found." }, 404);
  }

  if (comment.userId !== auth.userId) {
    return c.json({ message: "Forbidden. You can only delete your own comment." }, 403);
  }

  await database.delete(communityComment).where(eq(communityComment.id, comment.id));

  return c.json({ message: "Comment deleted successfully." });
});

export default communityComments;
