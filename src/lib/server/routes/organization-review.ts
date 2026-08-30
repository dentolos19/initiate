import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { organizationReview } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";

const organizationReviews = new Hono();

// Create review
organizationReviews.post("/:organizationId/reviews", async (c) => {
  const auth = getAuth(c);
  const organizationId = c.req.param("organizationId");
  const body = await c.req.json();

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { success, data } = z
    .object({
      title: z.string(),
      message: z.string(),
      stars: z.number().min(1).max(5),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid body format." }, 400);
  }

  const [createdReview] = await database
    .insert(organizationReview)
    .values({
      ...data,
      userId: auth.userId,
      organizationId: organizationId,
    })
    .returning({ id: organizationReview.id });
  const review = await database.query.organizationReview.findFirst({
    where: { id: createdReview.id },
    with: { user: true },
  });

  return c.json(review);
});

// Get all reviews for an organization
organizationReviews.get("/:organizationId/reviews", async (c) => {
  const organizationId = c.req.param("organizationId");

  const reviews = await database.query.organizationReview.findMany({
    where: {
      organizationId: organizationId,
    },
    with: {
      user: true,
    },
  });

  return c.json(reviews);
});

// Update a review
organizationReviews.put("/:organizationId/reviews/:reviewId", async (c) => {
  const auth = getAuth(c);
  const organizationId = c.req.param("organizationId");
  const reviewId = c.req.param("reviewId");

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const body = await c.req.json();

  const { success, data } = z
    .object({
      title: z.string(),
      message: z.string(),
      stars: z.number().min(1).max(5),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid request body." }, 400);
  }

  const review = await database.query.organizationReview.findFirst({
    where: {
      id: reviewId,
      organizationId: organizationId,
    },
  });

  if (!review) {
    return c.json({ error: "Review not found." }, 404);
  }

  if (review.userId !== auth.userId) {
    return c.json({ message: "You can only update your own reviews." }, 403);
  }

  await database.update(organizationReview).set(data).where(eq(organizationReview.id, reviewId));
  const updatedReview = await database.query.organizationReview.findFirst({
    where: { id: reviewId },
    with: { user: true },
  });

  return c.json(updatedReview);
});

// Delete a review
organizationReviews.delete("/:organizationId/reviews/:reviewId", async (c) => {
  const auth = getAuth(c);
  const organizationId = c.req.param("organizationId");
  const reviewId = c.req.param("reviewId");

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const review = await database.query.organizationReview.findFirst({
    where: {
      id: reviewId,
      organizationId: organizationId,
    },
  });

  if (!review) {
    return c.json({ error: "Review not found." }, 404);
  }

  await database.delete(organizationReview).where(eq(organizationReview.id, reviewId));

  return c.json({ message: "Review deleted successfully." });
});

export default organizationReviews;
