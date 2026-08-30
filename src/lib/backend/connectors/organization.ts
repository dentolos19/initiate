import { z } from "zod";

import { Order, orderSchema } from "#/lib/backend/connectors/orders";
import { BackendPrimitives } from "#/lib/backend/primitives";
import {
  OrderStatus,
  Organization,
  OrganizationReview,
  organizationReviewSchema,
  organizationSchema,
  Service,
  serviceSchema,
} from "#/lib/backend/schema";

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    queryOrganizations: async (query?: string, page: number = 1, limit: number = 10): Promise<Organization[]> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (query) {
        params.append("query", query);
      }
      const response = await primitives.get(`/organization?${params}`);
      return organizationSchema.array().parse(response);
    },

    searchOrganizations: async (query: string, page: number = 1, limit: number = 10): Promise<Organization[]> => {
      const response = await primitives.get(
        `/organization/search?${new URLSearchParams({
          query: query,
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return organizationSchema.array().parse(response);
    },

    popularOrganizations: async (page: number = 1, limit: number = 10): Promise<Organization[]> => {
      const response = await primitives.get(
        `/organization/popular?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return organizationSchema.array().parse(response);
    },

    getOrganization: async (id: "current" | string = "current"): Promise<Organization> => {
      const response = await primitives.get(`/organization/${id}`);
      return organizationSchema.parse(response);
    },

    updateOrganization: async (id: "current" | string = "current", data: any): Promise<Organization> => {
      const response = await primitives.put(`/organization/${id}`, data);
      return organizationSchema.parse(response);
    },

    getOrganizationServices: async (id: "current" | string = "current"): Promise<Service[]> => {
      const response = await primitives.get(`/organization/${id}/services`);
      return serviceSchema.array().parse(response);
    },

    getOrganizationOrders: async (id: "current" | string = "current", filter?: OrderStatus): Promise<Order[]> => {
      const params = new URLSearchParams();
      if (filter) params.append("filter", filter);
      const response = await primitives.get(`/organization/${id}/orders?${params}`);
      return orderSchema.array().parse(response);
    },

    getOrganizationOrderStatistics: async (id: "current" | string = "current") => {
      const response = await primitives.get(`/organization/${id}/orders/statistics`);
      return z
        .object({
          totalOrders: z.number(),
          pendingConfirmation: z.number(),
          pendingCompletion: z.number(),
          completedOrders: z.number(),
        })
        .parse(response);
    },

    likeOrganization: async (id: string): Promise<Organization> => {
      const response = await primitives.post(`/organization/${id}/like`);
      return organizationSchema.parse(response);
    },

    unlikeOrganization: async (id: string): Promise<Organization> => {
      const response = await primitives.post(`/organization/${id}/unlike`);
      return organizationSchema.parse(response);
    },

    // Organization Reviews

    createOrganizationReview: async (id: string, data: any): Promise<OrganizationReview> => {
      const response = await primitives.post(`/organization/${id}/reviews`, data);
      return organizationReviewSchema.parse(response);
    },

    updateOrganizationReview: async (id: string, reviewId: string, data: any): Promise<OrganizationReview> => {
      const response = await primitives.put(`/organization/${id}/reviews/${reviewId}`, data);
      return organizationReviewSchema.parse(response);
    },

    deleteOrganizationReview: async (id: string, reviewId: string): Promise<void> => {
      await primitives.delete(`/organization/${id}/reviews/${reviewId}`);
    },

    getOrganizationReviews: async (id: string): Promise<OrganizationReview[]> => {
      const response = await primitives.get(`/organization/${id}/reviews`);
      return organizationReviewSchema.array().parse(response);
    },
  };
}
