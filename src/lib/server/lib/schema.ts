import z from "zod";

const baseSchema = z.object({
  type: z.enum(["one_time", "recurring", "tiered", "metered"]),
  currency: z.string().min(3).max(3).default("sgd"),
});

const oneTimeSchema = baseSchema.extend({
  type: z.literal("one_time"),
  unit_amount: z.number().int().positive(),
});

const recurringSchema = baseSchema.extend({
  type: z.literal("recurring"),
  unit_amount: z.number().int().positive(),
  interval: z.enum(["day", "week", "month", "year"]),
});

const meteredSchema = baseSchema.extend({
  type: z.literal("metered"),
  unit_amount: z.number().int().positive(),
  interval: z.enum(["day", "week", "month", "year"]),
});

const tieredSchema = baseSchema.extend({
  type: z.literal("tiered"),
  tiers: z
    .array(
      z.object({
        up_to: z.union([z.number().int().positive(), z.literal("inf")]),
        unit_amount: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const priceSchema = z.discriminatedUnion("type", [oneTimeSchema, recurringSchema, tieredSchema, meteredSchema]);
