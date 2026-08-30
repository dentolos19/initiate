import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

export const statisticsSchema = z.object({
  counts: z.object({
    users: z.number(),
    organizations: z.number(),
    services: z.number(),
  }),
});

export type Statistics = z.infer<typeof statisticsSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    getStatistics: async (): Promise<Statistics> => {
      const response = await primitives.get("/admin/statistics");
      return statisticsSchema.parse(response);
    },

    synchronizePlatform: async (): Promise<void> => {
      await primitives.post("/admin/synchronize");
    },
  };
}
