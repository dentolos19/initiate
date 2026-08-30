import { Message } from "@ai-sdk/react";
import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

export const problemDraftSchema = z.object({
  description: z.string(),
  budget: z.string().nullish(),
  deadline: z.string().nullish(),
});

export type ProblemDraft = z.infer<typeof problemDraftSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    generateProblemDraft: async (messages: Message[]): Promise<ProblemDraft> => {
      const response = await primitives.post("/problem/draft", {
        messages: messages,
      });
      return problemDraftSchema.parse(response);
    },
  };
}
