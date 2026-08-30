import { z } from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

// Email Preferences Schema
export const emailPreferencesSchema = z.object({
  newsletters: z.boolean(),
  reviewReceived: z.boolean(),
  reviewResponse: z.boolean(),
  promos: z.boolean(),
  newFeatures: z.boolean(),
  maintenance: z.boolean(),
  paymentConfirm: z.boolean(),
  serviceUpdates: z.boolean(),
});

export type EmailPreferences = z.infer<typeof emailPreferencesSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    // Email Preferences
    getEmailPreferences: async (): Promise<EmailPreferences> => {
      const response = await primitives.get("/preferences");
      return emailPreferencesSchema.parse(response);
    },

    updateEmailPreferences: async (preferences: EmailPreferences): Promise<EmailPreferences> => {
      const response = await primitives.patch("/preferences", preferences);
      return emailPreferencesSchema.parse(response);
    },

    // Email Testing
    sendTestNewsletter: async (): Promise<{ message: string }> => {
      const response = await primitives.post("/api/test-newsletter");
      return z.object({ message: z.string() }).parse(response);
    },

    sendTestEmail: async (): Promise<{ message: string }> => {
      const response = await primitives.post("/api/test-email");
      return z.object({ message: z.string() }).parse(response);
    },
  };
}
