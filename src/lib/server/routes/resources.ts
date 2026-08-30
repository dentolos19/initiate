import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { resourceDocumentation, resourceGrant } from "#/lib/database/schema.js";
import { generationModel } from "#/lib/server/integrations/ai.js";
import { database, insertEmbedding } from "#/lib/server/integrations/database.js";
import { indexEmbeddings } from "#/lib/server/lib/embeddings.js";
import { getOrganization, getUser } from "#/lib/server/lib/utils.js";

const resources = new Hono();

// Create a grant
resources.post("/grants", async (c) => {
  const user = await getUser(c);
  if (user?.type !== "admin") {
    return c.json({ message: "Forbidden." }, 403);
  }

  console.log("=== GRANT CREATION DEBUG ===");
  try {
    const body = await c.req.json();
    console.log("1. Raw body received:", JSON.stringify(body, null, 2));

    const schema = z.object({
      name: z.string().min(1),
      provider: z.string().min(1),
      location: z.string().optional(),
      description: z.string().optional(),
      grant: z.string().optional(),
      criteria: z.array(z.string()).default([]),
      process: z.array(z.string()).default([]),
      websiteUrl: z.string().optional(),
      applyUrl: z.string().optional(),
      providerEmail: z.string().optional(),
      providerPhone: z.string().optional(),
      deadlineAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional(),
      confirmation: z.literal("confirm"),
    });

    const result = schema.safeParse(body);
    console.log("2. Validation result:", result);
    if (!result.success) {
      console.log("3. Validation errors:", result.error.errors);
      return c.json({ message: "Invalid data", errors: result.error.errors }, 400);
    }

    const { confirmation: _confirmation, deadlineAt, ...grantData } = result.data;
    console.log("4. Clean grant data:", grantData);
    console.log("5. Deadline:", deadlineAt);

    const [grant] = await database
      .insert(resourceGrant)
      .values({ ...grantData, deadlineAt: deadlineAt ? new Date(deadlineAt) : null })
      .returning();

    // Generate and store embeddings for the grant
    await indexEmbeddings(
      (vector) => insertEmbedding("resourceGrant", grant.id, vector),
      grant.name,
      grant.description,
      grant.provider,
      grant.location,
    );

    console.log("6. Grant created successfully:", grant);
    return c.json(grant);
  } catch (error) {
    console.error("7. Backend error:", error);
    return c.json({ message: "Server error", error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get all grants
resources.get("/grants", async (c) => {
  const grants = await database.query.resourceGrant.findMany({ orderBy: { createdAt: "desc" } });
  return c.json(grants);
});

// Update a grant
resources.put("/grants/:id", async (c) => {
  const user = await getUser(c);
  if (user?.type !== "admin") {
    return c.json({ message: "Forbidden." }, 403);
  }

  console.log("=== GRANT UPDATE DEBUG ===");
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    console.log("1. Grant ID:", id);
    console.log("2. Update body received:", JSON.stringify(body, null, 2));

    const schema = z.object({
      name: z.string().min(1),
      provider: z.string().min(1),
      location: z.string().optional(),
      description: z.string().optional(),
      grant: z.string().optional(),
      criteria: z.array(z.string()).default([]),
      process: z.array(z.string()).default([]),
      websiteUrl: z.string().optional(),
      applyUrl: z.string().optional(),
      providerEmail: z.string().optional(),
      providerPhone: z.string().optional(),
      deadlineAt: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
        .optional(),
      confirmation: z.literal("confirm"),
    });

    const result = schema.safeParse(body);
    console.log("3. Validation result:", result.success);
    if (!result.success) {
      console.log("4. Validation errors:", result.error.errors);
      return c.json({ message: "Invalid data", errors: result.error.errors }, 400);
    }

    const { confirmation: _confirmation, deadlineAt, ...grantData } = result.data;
    let parsedDeadline: Date | null = null;
    if (deadlineAt) {
      try {
        const dateTimeString =
          deadlineAt.includes(":") && deadlineAt.split(":").length === 2 ? deadlineAt + ":00" : deadlineAt;
        parsedDeadline = new Date(dateTimeString);
      } catch (error) {
        console.log("Date parsing error:", error);
      }
    }

    const [updatedGrant] = await database
      .update(resourceGrant)
      .set({ ...grantData, deadlineAt: parsedDeadline })
      .where(eq(resourceGrant.id, id))
      .returning();

    // Generate and store updated embeddings for the grant
    await indexEmbeddings(
      (vector) => insertEmbedding("resourceGrant", updatedGrant.id, vector),
      updatedGrant.name,
      updatedGrant.description,
      updatedGrant.provider,
      updatedGrant.location,
    );

    console.log("5. Grant updated successfully:", updatedGrant);
    return c.json(updatedGrant);
  } catch (error) {
    console.error("6. Backend update error:", error);
    return c.json({ message: "Server error", error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Delete a grant
resources.delete("/grants/:id", async (c) => {
  const user = await getUser(c);
  if (user?.type !== "admin") {
    return c.json({ message: "Forbidden." }, 403);
  }

  console.log("=== GRANT DELETE DEBUG ===");
  try {
    const id = c.req.param("id");
    console.log("1. Grant ID to delete:", id);

    const existingGrant = await database.query.resourceGrant.findFirst({ where: { id } });
    if (!existingGrant) {
      console.log("2. Grant not found");
      return c.json({ message: "Grant not found" }, 404);
    }

    console.log("2. Found grant:", existingGrant.name);
    await database.delete(resourceGrant).where(eq(resourceGrant.id, id));
    console.log("3. Grant deleted successfully");
    return c.json({ message: "Grant deleted successfully", deletedId: id });
  } catch (error) {
    console.error("4. Backend delete error:", error);
    return c.json({ message: "Server error", error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get AI analytics for a grant
resources.get("/grants/:id/analysis", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }
  const organization = await getOrganization(c);

  const id = c.req.param("id");
  const grant = await database.query.resourceGrant.findFirst({ where: { id } });
  if (!grant) {
    return c.json({ error: "Grant not found" }, 404);
  }

  const orgData = organization ? await database.query.organization.findFirst({ where: { id: organization.id } }) : null;

  const prompt = `
    You are a world‑class grant strategist. An organization is considering applying for the following grant—your job is to give them an exhaustive, actionable analysis.

    ---
    **ORGANIZATION PROFILE**
    ${JSON.stringify(orgData, null, 2)}

    Include in your analysis:
    - Mission & core activities
    - Key programs or services
    - Recent performance metrics or milestones (if available)
    - Unique strengths or differentiators

    ---
    **GRANT OPPORTUNITY DETAILS**
    ${JSON.stringify(grant, null, 2)}

    Pay attention to:
    - Grant provider’s focus areas and stated priorities
    - Geographic or sector restrictions
    - Application components (essay questions, budgets, partnerships)
    - Deadlines and timeline constraints

    ---
    **YOUR DELIVERABLES**
    Produce a structured response with these sections:

    1. **Strategic Fit**
      - Analyze how the grant’s goals align with the organization’s mission, programs, and impact areas.
      - Highlight three specific mission‑to‑grant linkages (e.g., “Your youth‑mentorship program maps directly to their youth development pillar”).

    2. **Competitive Edge & Gaps**
      - Identify two existing strengths in the organization’s profile that match the grant’s criteria.
      - Flag two potential weaknesses or missing pieces (e.g., “Budget line items are vague,” “No documented community partnerships”).

    3. **Application Roadmap**
      - Step‑by‑step actions to shore up gaps:
        • Data to gather (impact numbers, pilot outcomes)
        • Stakeholders to involve (board members, partner orgs)
        • Narrative hooks (compelling stories, testimonials)
      - What to draft first, second, and final polish items.

    4. **Winning Metrics & Storytelling**
      - Recommend 3 key performance indicators to showcase (e.g., “Reach of 200 families,” “Volunteer retention > 80%”).
      - Tips for weaving quantitative data with human stories.

    5. **Timeline & Next Steps**
      - A high‑level Gantt of tasks leading up to the deadline (e.g., “Week 1: outline; Week 2: stakeholder interviews; Week 3: write draft; Week 4: review & submit”).
      - Resources or templates they can leverage (budget template, letter of support).

    **Tone:** Highly professional, advisor‑level confidence, but approachable and empathetic to a small nonprofit or early‑stage social enterprise.

    Respond in clear Markdown with headings, bullet points, and numbered lists.
  `;

  try {
    const result = await generateText({ model: generationModel, prompt });
    return c.json({ analysis: result.text, grantId: id, organizationId: organization?.id ?? null });
  } catch (e) {
    console.error("Grant analysis error:", e);
    return c.json({ error: "Failed to generate analysis" }, 500);
  }
});

// Create a documentation
resources.post("/documentation", async (c) => {
  const user = await getUser(c);
  if (user?.type !== "admin") {
    return c.json({ message: "Forbidden." }, 403);
  }

  const body = await c.req.json();
  const { success, data } = z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      confirmation: z.literal("confirm"),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ message: "Invalid data" }, 400);
  }

  const { confirmation: _confirmation, ...docData } = data;
  const [doc] = await database.insert(resourceDocumentation).values(docData).returning();
  return c.json(doc);
});

// Update a documentation
resources.put("/documentation/:id", async (c) => {
  const user = await getUser(c);
  if (user?.type !== "admin") {
    return c.json({ message: "Forbidden." }, 403);
  }

  console.log("=== DOCUMENTATION UPDATE DEBUG ===");
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    console.log("1. Documentation ID:", id);
    console.log("2. Update body received:", JSON.stringify(body, null, 2));

    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      confirmation: z.literal("confirm"),
    });
    const result = schema.safeParse(body);
    console.log("3. Validation result:", result.success);
    if (!result.success) {
      console.log("4. Validation errors:", result.error.errors);
      return c.json({ message: "Invalid data", errors: result.error.errors }, 400);
    }

    const { confirmation: _confirmation, ...docData } = result.data;
    const [updatedDoc] = await database
      .update(resourceDocumentation)
      .set(docData)
      .where(eq(resourceDocumentation.id, id))
      .returning();
    console.log("5. Documentation updated successfully:", updatedDoc);
    return c.json(updatedDoc);
  } catch (error) {
    console.error("6. Backend update error:", error);
    return c.json({ message: "Server error", error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Delete a documentation
resources.delete("/documentation/:id", async (c) => {
  const user = await getUser(c);
  if (user?.type !== "admin") {
    return c.json({ message: "Forbidden." }, 403);
  }

  console.log("=== DOCUMENTATION DELETE DEBUG ===");
  try {
    const id = c.req.param("id");
    console.log("1. Documentation ID to delete:", id);

    const existingDoc = await database.query.resourceDocumentation.findFirst({ where: { id } });
    if (!existingDoc) {
      console.log("2. Documentation not found");
      return c.json({ message: "Documentation not found" }, 404);
    }

    console.log("2. Found documentation:", existingDoc.name);
    await database.delete(resourceDocumentation).where(eq(resourceDocumentation.id, id));
    console.log("3. Documentation deleted successfully");
    return c.json({ message: "Documentation deleted successfully", deletedId: id });
  } catch (error) {
    console.error("4. Backend delete error:", error);
    return c.json({ message: "Server error", error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Get all documentation
resources.get("/documentation", async (c) => {
  const docs = await database.query.resourceDocumentation.findMany({ orderBy: { createdAt: "desc" } });
  return c.json(docs);
});

export default resources;
