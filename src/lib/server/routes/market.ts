import { generateObject, generateText } from "ai";
import { sql } from "drizzle-orm";
import { Hono } from "hono";
import z from "zod";

import { serviceCountExtras } from "#/lib/database/query-fragments.js";
import { generationModel } from "#/lib/server/integrations/ai.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database, searchEmbeddings } from "#/lib/server/integrations/database.js";
import { generateEmbedding } from "#/lib/server/lib/embeddings.js";
import { getUser, safeParseInt } from "#/lib/server/lib/utils.js";

const market = new Hono();

// Curate services
market.get("/curate", async (c) => {
  const auth = getAuth(c);
  const query = c.req.query("query");

  if (!query) {
    return c.json({ message: "Query parameter is required" }, 400);
  }

  const embedding = await generateEmbedding(query);
  const serviceSimilarities = await searchEmbeddings("service", embedding.vector, 1);

  console.log(serviceSimilarities);

  if (!serviceSimilarities || serviceSimilarities.length === 0 || serviceSimilarities[0].similarity < 0.7) {
    return c.json({ message: "No curated services available." }, 404);
  }

  const serviceSimilarity = serviceSimilarities[0];
  const service = await database.query.service.findFirst({
    where: {
      id: serviceSimilarity.id,
      status: "published",
    },
    extras: serviceCountExtras,
    with: {
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  if (!service) {
    return c.json({ message: "Service not found." }, 404);
  }

  const result = await generateText({
    model: generationModel,
    prompt: `
      Based on the user's request: "${query}", I found this service that matches what they're looking for:

      Service: ${service.name}
      Description: ${service.description}
      Category: ${service.tags}

      Write a short, friendly recommendation (1-2 sentences) explaining why this service is perfect for their needs.
      Keep it simple and easy to understand - no technical terms or complex explanations.
      Focus on the main benefits and how it helps solve their problem.
    `,
  });

  return c.json({
    ...service,
    likes: service.likesCount,
    isLiked: (service?.likes?.length ?? 0) > 0,
    similarity: serviceSimilarity.similarity,
    summary: result.text,
  });
});

// Compare services
market.get("/compare", async (c) => {
  const ids = c.req.query("ids");

  if (!ids) {
    return c.json({ message: "IDs parameter is required." }, 400);
  }

  const services = await database.query.service.findMany({
    where: {
      id: {
        in: ids.split(",").map((id) => id.trim()),
      },
    },
    extras: serviceCountExtras,
    with: {
      organization: true,
      plans: true,
      reviews: {
        limit: 10,
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (services.length === 0) {
    return c.json({ message: "No services found for the provided IDs." }, 404);
  }

  if (!(services.length >= 2)) {
    return c.json({ message: "At least 2 services are required for comparison." }, 400);
  }

  const result = await generateObject({
    model: generationModel,
    schema: z.object({
      summary: z.string().describe("A brief comparison summary highlighting key differences."),
      categories: z.array(
        z.object({
          name: z.string().describe("The category name."),
          description: z.string().optional().describe("A brief description of the category."),
          features: z
            .array(
              z.object({
                name: z.string().describe("The feature name."),
                description: z.string().optional().describe("A brief description of the feature."),
                values: z.array(z.string()).describe("The values for this feature across the services."),
              }),
            )
            .describe("The features of the category."),
        }),
      ),
    }),
    prompt: `
      You are an expert service comparison analyst. Analyze and compare the following services with comprehensive data including plans and user reviews:

      Services Data:
      ${JSON.stringify(services, null, 2)}

      Create a detailed comparison across these categories:

      1. **Pricing & Plans Analysis**
         - Compare all available plans (Basic, Pro, Enterprise, etc.)
         - Analyze pricing tiers and value propositions
         - Identify free tiers, trial periods, or freemium models
         - Compare pricing intervals (monthly, yearly discounts)
         - Evaluate price per feature ratio

      2. **Service Features & Capabilities**
         - Core functionality and key features
         - Technical specifications and limitations
         - Integration capabilities and API access
         - Platform compatibility and support
         - Unique selling propositions

      3. **User Experience & Reviews**
         - Analyze review sentiment and star ratings
         - Identify common praise points from reviews
         - Highlight frequently mentioned issues or complaints
         - Compare average rating and review volume
         - Extract user satisfaction patterns

      4. **Value & ROI Assessment**
         - Cost-effectiveness for different use cases
         - Feature completeness vs price point
         - Scalability and growth potential
         - Long-term value proposition

      5. **Trust & Reliability**
         - Organization verification status
         - Company reputation and market presence
         - User base size (likes and review count)
         - Support quality mentioned in reviews

      For each feature comparison, use these value indicators:
      - "✓" = Fully supported/available/excellent
      - "✗" = Not supported/unavailable/poor
      - "Limited" = Basic support/partial functionality
      - "Premium" = Available only in paid plans
      - Specific values = Exact numbers, prices, ratings (e.g., "$10/mo", "4.5★", "50GB")

      Analysis Guidelines:
      - Base pricing analysis on actual plan data provided
      - Extract insights from review content and star ratings
      - Calculate average ratings from review data
      - Identify pricing sweet spots and value tiers
      - Note any significant user feedback patterns
      - Be objective and data-driven in comparisons
      - If data is missing, use "Unknown" rather than assumptions

      Ensure each feature's values array has one entry per service in the same order as the services array.
      Focus on actionable insights that help users make informed decisions.
    `,
  });

  return c.json({
    ...result.object,
    services: services,
  });
});

// Get services by tag
market.get("/tag/:tag", async (c) => {
  const user = await getUser(c);
  const tag = c.req.param("tag");
  const page = safeParseInt(c.req.query("page"), 1);
  const limit = safeParseInt(c.req.query("limit"), 10);

  const services = (
    await database.query.service.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      where: {
        status: "published",
        RAW: (service) => sql`exists (select 1 from json_each(${service.tags}) where value = ${tag})`,
      },
      orderBy: {
        createdAt: "desc",
      },
      extras: serviceCountExtras,
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

export default market;
