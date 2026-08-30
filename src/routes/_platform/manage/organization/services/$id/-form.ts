import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const formSchema = z.object({
  id: z.string().optional(),
  imageUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  name: z.string().trim().min(1, "Enter a service name."),
  type: z.string(),
  status: z.string(),
  description: z.string().optional(),
  tagline: z.string().optional(),
  tags: z.string().array().optional(),
});

export type FormValues = z.infer<typeof formSchema>;
export type FormController = UseFormReturn<FormValues>;
