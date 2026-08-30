import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";
import { Service, serviceSchema } from "#/lib/backend/schema";

export const comparisonSchema = z.object({
  summary: z.string(),
  categories: z
    .object({
      name: z.string(),
      description: z.string(),
      features: z
        .object({
          name: z.string(),
          description: z.string().nullish(),
          values: z.string().array(),
        })
        .array(),
    })
    .array(),
  services: serviceSchema.array(),
});

export type Comparison = z.infer<typeof comparisonSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    curateServices: async (query: string): Promise<Service> => {
      const response = await primitives.get(
        `/market/curate?${new URLSearchParams({
          query: query,
        })}`,
      );
      return serviceSchema.parse(response);
    },

    compareServices: async (serviceIds: string[]): Promise<Comparison> => {
      const response = await primitives.get(
        `/market/compare?${new URLSearchParams({
          ids: serviceIds.join(","),
        })}`,
      );
      return comparisonSchema.parse(response);
    },

    servicesByTag: async (tag: string, page: number = 1, limit: number = 10): Promise<Service[]> => {
      const response = await primitives.get(
        `/market/tag/${tag}?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return serviceSchema.array().parse(response);
    },
  };
}
