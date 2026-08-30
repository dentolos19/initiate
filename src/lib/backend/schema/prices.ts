import { z } from "zod";

const baseSchema = z.object({
  currency: z.string().min(1),
  nickname: z.string().optional(),
});

const oneTimePriceSchema = baseSchema.extend({
  type: z.literal("one_time"),
  unit_amount: z.number().int().positive(),
});

const recurringPriceSchema = baseSchema.extend({
  type: z.literal("recurring"),
  unit_amount: z.number().int().positive(),
  recurring: z.object({
    interval: z.enum(["day", "week", "month", "year"]),
    interval_count: z.number().int().positive().default(1),
    usage_type: z.enum(["licensed", "metered"]).optional(),
  }),
});

const tieredPriceSchema = baseSchema.extend({
  type: z.literal("tiered"),
  tiers_mode: z.enum(["graduated", "volume"]).default("volume"),
  recurring: z.object({
    interval: z.enum(["day", "week", "month", "year"]),
    interval_count: z.number().int().positive().default(1),
    usage_type: z.enum(["licensed", "metered"]).optional(),
  }),
  tiers: z
    .array(
      z.object({
        up_to: z.union([z.literal("inf"), z.number().int().positive()]),
        unit_amount: z.number().int().positive(),
      }),
    )
    .nonempty(),
});

export const priceSchema = z.discriminatedUnion("type", [oneTimePriceSchema, recurringPriceSchema, tieredPriceSchema]);

export type Price = z.infer<typeof priceSchema>;
