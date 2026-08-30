import { eq } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { communityPostCountExtras } from "#/lib/database/query-fragments.js";
import { communityProposal, order } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { checkMembership, safeParseInt } from "#/lib/server/lib/utils.js";

const communityProblems = new Hono();

// Get problem posts
communityProblems.get("/problems", async (c) => {
  const auth = getAuth(c);
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const posts = (
    await database.query.communityPost.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      where: {
        type: "problem",
      },
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

// Create a proposal
communityProblems.post("/:postId/proposals", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const postId = c.req.param("postId");
  const body = await c.req.json();

  const { success, data } = await z
    .object({
      organizationId: z.string(),
      title: z.string(),
      content: z.string(),
      duration: z.number(),
      cost: z.number(),
    })
    .safeParseAsync(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const authorized = await checkMembership(auth.userId, data.organizationId);

  if (!authorized) {
    return c.json({ message: "You are not a member of the organization." }, 403);
  }

  const [createdProposal] = await database
    .insert(communityProposal)
    .values({
      postId: postId,
      userId: auth.userId,
      organizationId: data.organizationId,
      title: data.title,
      content: data.content,
      duration: data.duration,
      cost: data.cost,
    })
    .returning({ id: communityProposal.id });
  const proposal = await database.query.communityProposal.findFirst({
    where: { id: createdProposal.id },
    with: {
      user: true,
      organization: true,
    },
  });

  return c.json(proposal);
});

// Get proposals
communityProblems.get("/:postId/proposals", async (c) => {
  const postId = c.req.param("postId");

  const proposals = await database.query.communityProposal.findMany({
    where: {
      postId: postId,
    },
    with: {
      user: true,
      organization: true,
    },
  });

  return c.json(proposals);
});

// Update a proposal
communityProblems.put("/proposals/:proposalId", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const proposalId = c.req.param("proposalId");
  const body = await c.req.json();

  const { success, data } = await z
    .object({
      title: z.string().optional(),
      content: z.string().optional(),
      duration: z.number().optional(),
      cost: z.number().optional(),
    })
    .safeParseAsync(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const existingProposal = await database.query.communityProposal.findFirst({
    where: {
      id: proposalId,
    },
    columns: {
      organizationId: true,
    },
  });

  if (!existingProposal) {
    return c.json({ message: "Proposal not found." }, 404);
  }

  // const authorized = checkMembership(auth.userId, existingProposal.organizationId);

  // if (!authorized) {
  //   return c.json({ message: "You are not a member of the organization." }, 403);
  // }

  await database.update(communityProposal).set(data).where(eq(communityProposal.id, proposalId));
  const proposal = await database.query.communityProposal.findFirst({
    where: { id: proposalId },
    with: {
      user: true,
      organization: true,
    },
  });

  return c.json(proposal);
});

// Delete a proposal
communityProblems.delete("/proposals/:proposalId", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const proposalId = c.req.param("proposalId");

  const existingProposal = await database.query.communityProposal.findFirst({
    where: {
      id: proposalId,
    },
  });

  if (!existingProposal) {
    return c.json({ message: "Proposal not found." }, 404);
  }

  // const authorized = checkMembership(auth.userId, existingProposal.organizationId);

  // if (!authorized) {
  //   return c.json({ message: "You are not a member of the organization." }, 403);
  // }

  await database.delete(communityProposal).where(eq(communityProposal.id, proposalId));

  return c.json({ message: "Proposal deleted successfully." });
});

// Accept or reject a proposal
communityProblems.patch("/proposals/:proposalId/status", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const proposalId = c.req.param("proposalId");
  const body = await c.req.json();

  const { success, data } = await z
    .object({
      status: z.string(),
    })
    .safeParseAsync(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const existingProposal = await database.query.communityProposal.findFirst({
    where: {
      id: proposalId,
    },
    with: {
      post: true,
    },
  });

  if (!existingProposal) {
    return c.json({ message: "Proposal not found." }, 404);
  }

  if (!existingProposal.post || existingProposal.post.userId !== auth.userId) {
    return c.json({ message: "Only the problem author can accept or reject proposals." }, 403);
  }

  await database.update(communityProposal).set({ status: data.status }).where(eq(communityProposal.id, proposalId));
  const proposal = await database.query.communityProposal.findFirst({
    where: { id: proposalId },
    with: {
      user: true,
      organization: true,
      post: true,
    },
  });

  if (!proposal?.post) {
    return c.json({ message: "Proposal not found after update." }, 404);
  }

  if (data.status === "accepted" && proposal.organizationId) {
    await database.insert(order).values({
      userId: proposal.post.userId,
      organizationId: proposal.organizationId,
      description: proposal.title,
      instructions: `${proposal.content}\n\nOriginal problem: ${proposal.post.title}`,
      status: "draft",
      dueAt: proposal.duration ? new Date(Date.now() + proposal.duration * 24 * 60 * 60 * 1000) : null,
    });
  }

  return c.json(proposal);
});

export default communityProblems;
