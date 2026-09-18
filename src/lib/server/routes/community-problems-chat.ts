import {
  createUIMessageStreamResponse,
  toUIMessageStream,
  convertToModelMessages,
  generateObject,
  streamText,
} from "ai";
import { Hono } from "hono";
import z from "zod";

import { generationModel } from "#/lib/server/integrations/ai.js";

const problemChat = new Hono();

// problem chat (ai asistant help to explain the problem)
problemChat.post("/chat", async (c) => {
  const { messages } = await c.req.json();

  // Check for skip commands in the latest message
  const latestMessage = messages[messages.length - 1];
  const text =
    latestMessage?.parts
      ?.filter((part: { type: string }) => part.type === "text")
      .map((part: { text: string }) => part.text)
      .join("") ?? "";
  const skipQuestion = text.toLowerCase().includes("skip this question");
  const skipAll = text.toLowerCase().includes("skip all");

  const systemPrompt = `
    You are an AI assistant whose ONLY job is to help the user articulate their **problem**, NOT to propose solutions.
    Each time you ask exactly one follow-up question (max 10 total), waiting for the user's reply (or a special “Skip” / “Skip All” command) before proceeding.
    If the user sends “Skip”, acknowledge and move to the next question.
    If the user sends “Skip All”, stop asking and move to drafting the final problem post.
    Always keep your tone friendly, concise, and professional.
    `.trim();

  const userContent = skipAll
    ? "The user has requested to skip all questions and proceed to drafting the problem post."
    : skipQuestion
      ? "The user has requested to skip this question."
      : "";

  const payload = {
    model: generationModel,
    messages: await convertToModelMessages(
      [
        { id: "system", role: "system", parts: [{ type: "text", text: systemPrompt }] },
        ...messages,
        userContent && { id: "skip", role: "user", parts: [{ type: "text", text: userContent }] },
      ].filter(Boolean),
    ),
  };

  const result = streamText(payload);

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
});

// final draft generator
problemChat.post("/draft", async (c) => {
  // message history including user answers and skipped questions
  const { messages } = await c.req.json();

  const systemPrompt = `
    You are an AI drafting assistant. Using the user’s answers (and any skipped placeholders), generate a **final problem post** object with:
    - description (detailed, cohesive write-up, should be from the perspective of the user)
    - budget summary (if provided)
    - deadline (if provided)

    Return JSON matching:
    {
    "description": string,
    "budget": string | null,
    "deadline": string | null
    }
  `.trim();

  const result = await generateObject({
    model: generationModel,
    messages: await convertToModelMessages([
      { id: "system", role: "system", parts: [{ type: "text", text: systemPrompt }] },
      ...messages,
    ]),
    schema: z.object({
      description: z.string(),
      budget: z.string().nullish(),
      deadline: z.string().nullish(),
    }),
  });

  return c.json(result.object);
});

export default problemChat;
