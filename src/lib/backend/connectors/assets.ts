import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

export const assetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  size: z.number(),
  hash: z.string(),
  url: z.string(),
  accessedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type Asset = z.infer<typeof assetSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    uploadFile: async (file: File): Promise<Asset> => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await primitives.post(`/assets`, formData);
      return assetSchema.parse(response);
    },

    getFile: async (id: string): Promise<Asset> => {
      const response = await primitives.get(`/assets/${id}`);
      return assetSchema.parse(response);
    },
  };
}
