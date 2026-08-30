import { generateObject, generateText } from "ai";
import { Hono } from "hono";
import z from "zod";

import { generationModel } from "#/lib/server/integrations/ai.js";
import { database } from "#/lib/server/integrations/database.js";
import { getOrganizationId } from "#/lib/server/lib/utils.js";

const ai = new Hono();

// Generate a summary from text
ai.post("/summary", async (c) => {
  const body = await c.req.json();

  const { success, data } = z
    .object({
      text: z.string().describe("The text to summarize."),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  const result = await generateText({
    model: generationModel,
    prompt: `
      You are an expert summarizer. Your task is to create a concise summary of the provided text.
      Focus on the main points, key details, and overall message.
      Ensure the summary is clear, coherent, and captures the essence of the original content.
      Here is the text to summarize:
      ${data.text}
    `,
  });

  return c.json({ result: result.text });
});

// Generate an excerpt from text
ai.post("/excerpt", async (c) => {
  const body = await c.req.json();

  const { success, data } = z
    .object({
      text: z.string().describe("The text to generate an excerpt from."),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  const result = await generateText({
    model: generationModel,
    prompt: `
      You are an expert content creator. Your task is to generate a concise excerpt from the provided text.
      The excerpt must be exactly one sentence and contain no more than 8 words.
      Focus on capturing the most essential point in a brief, engaging way.
      Here is the text to generate an excerpt from:
      ${data.text}
    `,
  });

  return c.json({ result: result.text });
});

// Determine grant suitability
ai.post("/grant/suitability", async (c) => {
  // get organisation details
  const orgId = getOrganizationId(c);

  if (!orgId) {
    return c.json({ error: "Organization not found." }, 404);
  }

  const org = await database.query.organization.findFirst({
    where: { id: orgId },
    with: {
      services: true,
    },
  });

  if (!org) {
    return c.json({ error: "Organization not found." }, 404);
  }

  // get the grant details from frontend
  const body = await c.req.json();

  const { success, data } = z
    .object({
      id: z.string(),
      name: z.string(),
      provider: z.string(),
      location: z.string().nullish(),
      description: z.string().nullish(),
      grant: z.string().nullish(), // funding amount
      criteria: z.string().array().default([]), // eligibility criteria
      process: z.string().array().default([]), // application process
      websiteUrl: z.string().nullish(),
      applyUrl: z.string().nullish(),
      providerEmail: z.string().nullish(),
      providerPhone: z.string().nullish(),
      deadlineAt: z.string().nullish(),
    })
    .safeParse(body.grant);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  // generate a suitability assessment for the grant
  const result = await generateObject({
    model: generationModel,
    prompt: `
      You are an expert grant advisor. Your task is to assess the suitability of a grant for a specific organization.
      Here are the details of the organization:
      - Name: ${org.name}
      - Description: ${org.description}
      - Industries: ${org.tags}
      - Type: ${org.type}
      - Services: ${org.services
        .map((service) => {
          let serviceInfo = service.name;
          if (service.description) {
            serviceInfo += ` (${service.description})`;
          }
          return serviceInfo;
        })
        .join(", ")}

      Here are the details of the grant:
      - Name: ${data.name}
      - Provider: ${data.provider}
      - Location: ${data.location || "Not specified"}
      - Funding: ${data.grant || "Not specified"}
      - Description: ${data.description || "No description provided"}
      - Deadline: ${data.deadlineAt || "No deadline specified"}
      - Eligibility Criteria: ${data.criteria.length > 0 ? data.criteria.join(", ") : "No criteria specified"}
      - Application Process: ${data.process.length > 0 ? data.process.join(", ") : "No process specified"}
      - Contact Information: Website: ${data.websiteUrl || data.applyUrl || "N/A"}, Email: ${data.providerEmail || "N/A"}, Phone: ${data.providerPhone || "N/A"}

      Assess whether this grant is suitable for the organization based on its services, description, and the provided grant details.

      Provide a comprehensive assessment that includes:
      1. **Alignment Score**: How well the organization's services and description align with the grant's focus and requirements
      2. **Key Strengths**: Specific aspects of the organization that make it a strong candidate
      3. **Potential Gaps**: Any areas where the organization might not fully meet the criteria
      4. **Strategic Benefits**: What specific benefits this grant could bring to the organization
      5. **Application Recommendations**: Concrete steps to improve chances of success

      Keep the assessment concise but thorough (3-4 paragraphs max). Be honest about suitability while being constructive.
      Focus on actionable insights that will help the organization make an informed decision.
    `,
    schema: z.object({
      result: z.string().describe("A comprehensive assessment of grant suitability with actionable insights"),
      similarityScore: z
        .number()
        .min(0)
        .max(100)
        .describe(
          "A similarity score between 0 and 100 indicating how suitable the organization is for the grant. If there is insufficient information to determine suitability, return a low score. Don't falsely return a high suitability score.",
        ),
    }),
  });

  console.log("AI response for grant suitability", result.object);

  return c.json({ result: result.object });
});

// Enhance problem statement content
ai.post("/enhance-problem", async (c) => {
  const body = await c.req.json();

  const { success, data } = z
    .object({
      content: z.string().describe("The problem statement content to enhance."),
      title: z.string().optional().describe("The title of the problem statement."),
      budget: z.number().optional().describe("The budget for the problem."),
    })
    .safeParse(body);

  if (!success) {
    return c.json({ error: "Invalid request body." }, 400);
  }

  const result = await generateText({
    model: generationModel,
    prompt: `
      You are an expert problem statement advisor. Your task is to help the user clearly and compellingly articulate their problem so it attracts attention and engagement from potential solution providers.

      Guidelines for enhancement:

      Make the problem statement more specific, clear, and actionable.
      Improve readability and structure (organized logically) and formatted appropriately with paragraphs, bolding and bullet points when needed.
      Add relevant context if missing (but only based on details the user provided).
      Use professional yet accessible language.
      Clearly communicate the problem's importance, impact, and urgency.
      Focus on describing the problem only — do not propose solutions or desired outcomes unless the problem content provided explicitly contains a desired outcome.
      The output should be a polished, well-structured problem statement that accurately reflects the user's challenge without suggesting solutions.
      Output should be in the following format:
        - Problem Statement
        - Business Objective
        - User Stories
        - Requirements Overview
        - Summary of Purpose

      ${data.title ? `Title: ${data.title}` : ""}
      ${data.budget ? `Budget: $${data.budget}` : ""}

      Current problem statement content:
      ${data.content}

      Please provide an enhanced version of this problem statement that follows best practices for problem definition and solution attraction. Return only the enhanced content without additional commentary.
      Return only the pure HTML content. Do not wrap it in markdown code fences (\`\`\`html … \`\`\`), do not include any extra text—just the raw HTML.`,
  });

  return c.json({ result: result.text });
});

export default ai;
