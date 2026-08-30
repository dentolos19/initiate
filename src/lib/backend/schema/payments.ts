import { z } from "zod";

export const paymentAccountSchema = z.object({
  id: z.string().nullish(),
  mode: z.literal("demo"),
  status: z.enum(["setup", "ready"]),
  currency: z.string(),
  availableBalance: z.number().int(),
  pendingBalance: z.number().int(),
  refundedAmount: z.number().int(),
  paidInvoices: z.number().int(),
  openInvoices: z.number().int(),
});

export const paymentResultSchema = z.object({
  outcome: z.enum(["approved", "declined"]),
  message: z.string(),
});

export type PaymentAccount = z.infer<typeof paymentAccountSchema>;
export type PaymentResult = z.infer<typeof paymentResultSchema>;
