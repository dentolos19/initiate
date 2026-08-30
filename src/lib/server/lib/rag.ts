import { generateText } from "ai";

import { generationModel } from "#/lib/server/integrations/ai.js";
import { generateEmbedding, queryEmbedding } from "#/lib/server/lib/embeddings.js";

type RAGOptions = {
  namespace?: string;
  amount?: number;
};

export async function runRAG(query: string, options?: RAGOptions) {
  const embedding = await generateEmbedding(query);

  const results = await queryEmbedding(embedding, {
    namespace: options?.namespace,
    amount: options?.amount ?? 5,
  });

  const contextText = results.map((r, i) => `Result ${i + 1}: ${r.content}`).join("\n\n");

  const prompt = `You are an assistant helping users understand information related to their query.
            Do not mention the user's query or reference the list of results directly. Instead, write a helpful, explanation that summarizes key ideas, patterns, or insights that motivated the selected content.
            Avoid phrases like "AI overview", "The user searched", or "These results are relevant because". Focus purely on delivering clear and useful information as if you're informing the user directly.
            Respond in a confident, clear tone.

            Query: "${query}"
            Retrieved content:
            ${contextText}

            Now provide the summary:`;

  const result = await generateText({
    model: generationModel,
    prompt,
  });

  const overview = result.text;

  const data = { overview, results };

  return data;
}

export async function summariseContent(text: string) {
  try {
    const prompt = `You are an AI assistant that summarizes content.
      Please provide a concise summary of the following text:

      "${text}"

      The summary should capture the main points and key insights in a clear and concise manner.
      Summary should be no more than 100 characters long`;

    const result = await generateText({
      model: generationModel,
      prompt,
    });

    return result.text ?? "Summary unavailable";
  } catch (error) {
    console.error("Summarization failed:", error);
    return "Summary unavailable";
  }
}
