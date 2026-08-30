import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { serviceReview } from "#/lib/database/schema.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";

const serviceReviews = new Hono();

// Create a review
serviceReviews.post("/:serviceId/reviews", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: "Please.login" }, 401);
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

  const serviceId = c.req.param("serviceId");

  const service = await database.query.service.findFirst({
    where: {
      id: serviceId,
    },
    columns: {
      id: true,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  // Check if the user has ordered this service
  const order = await database.query.order.findFirst({
    where: {
      userId: auth.userId,
      serviceId: service.id,
    },
    columns: {
      id: true,
    },
  });

  if (!order) {
    return c.json({ message: "You can only review services you have ordered." }, 403);
  }

  const [createdReview] = await database
    .insert(serviceReview)
    .values({
      ...data,
      userId: auth.userId,
      serviceId,
    })
    .returning({ id: serviceReview.id });
  const review = await database.query.serviceReview.findFirst({
    where: { id: createdReview.id },
    with: { user: true },
  });

  return c.json(review);
});

// Update a review
serviceReviews.put("/:serviceId/reviews/:reviewId", async (c) => {
  const auth = getAuth(c);
  const serviceId = c.req.param("serviceId");
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

  const review = await database.query.serviceReview.findFirst({
    where: {
      id: reviewId,
      serviceId,
    },
  });

  if (!review) {
    return c.json({ message: "Review not found." }, 404);
  }

  if (review.userId !== auth.userId) {
    return c.json({ message: "You can only update your own reviews." }, 403);
  }

  await database.update(serviceReview).set(data).where(eq(serviceReview.id, reviewId));
  const updatedReview = await database.query.serviceReview.findFirst({
    where: { id: reviewId },
    with: { user: true },
  });

  return c.json(updatedReview);
});

// Delete a review
serviceReviews.delete("/:serviceId/reviews/:reviewId", async (c) => {
  const auth = getAuth(c);
  const serviceId = c.req.param("serviceId");
  const reviewId = c.req.param("reviewId");

  if (!auth?.userId) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const review = await database.query.serviceReview.findFirst({
    where: {
      id: reviewId,
      serviceId,
    },
  });

  if (!review) {
    return c.json({ message: "Review not found." }, 404);
  }

  await database.delete(serviceReview).where(eq(serviceReview.id, reviewId));

  return c.json({ message: "Review deleted successfully." });
});

// Get all reviews for a service
serviceReviews.get("/:serviceId/reviews", async (c) => {
  const serviceId = c.req.param("serviceId");

  const reviews = await database.query.serviceReview.findMany({
    where: {
      serviceId: serviceId,
    },
    with: {
      user: true,
    },
  });

  return c.json(reviews);
});

export default serviceReviews;
