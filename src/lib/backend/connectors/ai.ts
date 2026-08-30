import { Message } from "@ai-sdk/react";
import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

import { ResourceGrant } from "../schema";

export const userChatSchema = z.object({
  id: z.string(),
  name: z.string(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type UserChat = z.infer<typeof userChatSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    generateSummary: async (text: string): Promise<string> => {
      const response = await primitives.post("/ai/summary", {
        text: text,
      });
      return z
        .object({
          result: z.string(),
        })
        .parse(response).result;
    },

    generateExcerpt: async (text: string): Promise<string> => {
      const response = await primitives.post("/ai/excerpt", {
        text: text,
      });
      return z
        .object({
          result: z.string(),
        })
        .parse(response).result;
    },

    enhanceProblemStatement: async (content: string, title?: string, budget?: number): Promise<string> => {
      const response = await primitives.post("/ai/enhance-problem", {
        content: content,
        title: title,
        budget: budget,
      });
      return z
        .object({
          result: z.string(),
        })
        .parse(response).result;
    },

    // Agent

    getAgent: async (): Promise<string> => {
      const response = await primitives.post("/ai/agent");
      return z
        .object({
          id: z.string(),
        })
        .parse(response).id;
    },

    // Chat

    getChatHistory: async (): Promise<UserChat[]> => {
      const response = await primitives.get("/ai/chat");
      return z.array(userChatSchema).parse(response);
    },

    getChatHistories: async (id: string): Promise<Message[]> => {
      const response = await primitives.get(`/ai/chat/${id}`);
      const data = z.object({ messages: z.any() }).parse(response);
      return data.messages;
    },

    deleteChatHistory: async (id: string): Promise<void> => {
      await primitives.delete(`/ai/chat/${id}`);
    },

    generateSuggestions: async (messages: Message[]): Promise<string[]> => {
      const response = await primitives.post(`/ai/chat/suggest`, {
        messages: messages,
      });
      return z
        .object({
          suggestions: z.string().array(),
        })
        .parse(response).suggestions;
    },

    generateProblemStatementSummary: async (messages: Message[]): Promise<string> => {
      const response = await primitives.post(`/ai/chat/generate-summary`, {
        messages: messages,
      });
      return z
        .object({
          summary: z.string(),
        })
        .parse(response).summary;
    },

    getGrantSuitability: async (grant: ResourceGrant) => {
      const response = await primitives.post("/ai/grant/suitability", {
        grant: grant,
      });
      console.log("AI response for grant suitability", response);
      return z
        .object({
          result: z.string(),
          similarityScore: z.number(),
        })
        .parse(response.result);
    },
  };
}
