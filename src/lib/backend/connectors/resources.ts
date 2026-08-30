import { BackendPrimitives } from "#/lib/backend/primitives";

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    // Get all documentation
    getDocumentation: async () => {
      return await primitives.get("/resources/documentation");
    },

    // Get all grants
    getGrants: async () => {
      return await primitives.get("/resources/grants");
    },

    // Create documentation (admin only)
    createDocumentation: async (data: any) => {
      return await primitives.post("/resources/documentation", data);
    },

    // Create grant (admin only)
    createGrant: async (data: any) => {
      return await primitives.post("/resources/grants", data);
    },

    // FIXED: Update documentation (admin only)
    updateDocumentation: async (id: string, data: any) => {
      return await primitives.put(`/resources/documentation/${id}`, data);
    },

    // FIXED: Update grant (admin only)
    updateGrant: async (id: string, data: any) => {
      return await primitives.put(`/resources/grants/${id}`, data);
    },

    // FIXED: Delete documentation (admin only)
    deleteDocumentation: async (id: string, confirmation: string) => {
      return await primitives.delete(`/resources/documentation/${id}`);
    },

    // FIXED: Delete grant (admin only)
    deleteGrant: async (id: string, confirmation: string) => {
      return await primitives.delete(`/resources/grants/${id}`);
    },
  };
}
