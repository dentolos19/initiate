import { z } from "zod";

export const stripeConnectSchema = z.object({
  id: z.string(),
  details_submitted: z.boolean(),
  charges_enabled: z.boolean(),
  payouts_enabled: z.boolean(),
});

export const stripeConnectLinkSchema = z.object({
  url: z.string(),
});

export const stripeConnectSessionSchema = z.object({
  client_secret: z.string(),
});

export const stripeCheckoutSessionSchema = z.object({
  url: z.string().nullish(),
  metadata: z.object({
    id: z.string().nullish(),
    accountId: z.string(),
    customerId: z.string(),
    userId: z.string(),
    planId: z.string(),
  }),
});

export type StripeConnect = z.infer<typeof stripeConnectSchema>;
export type StripeConnectLink = z.infer<typeof stripeConnectLinkSchema>;
export type StripeConnectSession = z.infer<typeof stripeConnectSessionSchema>;
export type StripeCheckoutSession = z.infer<typeof stripeCheckoutSessionSchema>;
