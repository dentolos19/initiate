import { BackendPrimitives } from "#/lib/backend/primitives";
import { resourceDocumentationSchema, resourceGrantSchema } from "#/lib/backend/schema";

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    // Get all documentation
    getDocumentation: async () => {
      return resourceDocumentationSchema.array().parse(await primitives.get("/resources/documentation"));
    },

    // Get all grants
    getGrants: async () => {
      return resourceGrantSchema.array().parse(await primitives.get("/resources/grants"));
    },

    // Create documentation (admin only)
    createDocumentation: async (data: Record<string, unknown>) => {
      return await primitives.post("/resources/documentation", data);
    },

    // Create grant (admin only)
    createGrant: async (data: Record<string, unknown>) => {
      return await primitives.post("/resources/grants", data);
    },

    // FIXED: Update documentation (admin only)
    updateDocumentation: async (id: string, data: Record<string, unknown>) => {
      return await primitives.put(`/resources/documentation/${id}`, data);
    },

    // FIXED: Update grant (admin only)
    updateGrant: async (id: string, data: Record<string, unknown>) => {
      return await primitives.put(`/resources/grants/${id}`, data);
    },

    // FIXED: Delete documentation (admin only)
    deleteDocumentation: async (id: string, _confirmation: string) => {
      return await primitives.delete(`/resources/documentation/${id}`);
    },

    // FIXED: Delete grant (admin only)
    deleteGrant: async (id: string, _confirmation: string) => {
      return await primitives.delete(`/resources/grants/${id}`);
    },
  };
}
