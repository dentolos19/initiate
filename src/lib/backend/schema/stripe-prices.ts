import { z } from "zod";

const baseSchema = z.object({
  currency: z.string().min(1),
  product: z.string().min(1),
  nickname: z.string().optional(),
  tax_behavior: z.enum(["exclusive", "inclusive", "unspecified"]).optional(),
  metadata: z.record(z.string()).optional(),
  active: z.boolean().optional(),
});

// One-Time
const oneTimePriceSchema = baseSchema.extend({
  type: z.literal("one_time"),
  unit_amount: z.number().int().positive(),
  billing_scheme: z.literal("per_unit").optional(),
});

// Recurring
const recurringPriceSchema = baseSchema.extend({
  type: z.literal("recurring"),
  unit_amount: z.number().int().positive(),
  recurring: z.object({
    interval: z.enum(["day", "week", "month", "year"]),
    interval_count: z.number().int().positive().default(1),
    usage_type: z.enum(["licensed", "metered"]).optional(),
  }),
  billing_scheme: z.literal("per_unit").optional(),
});

// Tiered
const tieredPriceSchema = baseSchema.extend({
  type: z.literal("tiered"),
  billing_scheme: z.literal("tiered"),
  recurring: z.object({
    interval: z.enum(["day", "week", "month", "year"]),
    interval_count: z.number().int().positive().default(1),
    usage_type: z.enum(["licensed", "metered"]).optional(),
  }),
  tiers_mode: z.enum(["graduated", "volume"]),
  tiers: z
    .array(
      z.object({
        up_to: z.union([z.literal("inf"), z.number().int().positive()]),
        unit_amount: z.number().int().positive(),
      }),
    )
    .nonempty(),
});

export const stripePriceSchema = z.discriminatedUnion("type", [
  oneTimePriceSchema,
  recurringPriceSchema,
  tieredPriceSchema,
]);

export type StripePrice = z.infer<typeof stripePriceSchema>;
