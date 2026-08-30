import { z } from "zod";

import {
  CommunityPost,
  communityPostSchema,
  CommunityProposal,
  communityProposalSchema,
} from "#/lib/backend/connectors/community";
import { Order, OrderInvoice, orderInvoiceSchema, orderSchema } from "#/lib/backend/connectors/orders";
import { BackendPrimitives } from "#/lib/backend/primitives";
import {
  OrderStatus,
  Organization,
  organizationSchema,
  Service,
  serviceSchema,
  User,
  userSchema,
} from "#/lib/backend/schema";

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    queryUsers: async (query?: string, page: number = 1, limit: number = 10): Promise<User[]> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (query) {
        params.append("query", query);
      }
      const response = await primitives.get(`/user?${params}`);
      return userSchema.array().parse(response);
    },

    searchUsers: async (query: string, page: number = 1, limit: number = 10): Promise<User[]> => {
      const response = await primitives.get(
        `/user/search?${new URLSearchParams({
          query: query,
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return userSchema.array().parse(response);
    },

    getUser: async (id: "current" | string = "current"): Promise<User> => {
      const response = await primitives.get(`/user/${id}`);
      return userSchema.parse(response);
    },

    updateUser: async (id: "current" | string, data: any): Promise<User> => {
      const response = await primitives.put(`/user/${id}`, data);
      return userSchema.parse(response);
    },

    getUserOrganizations: async (id: "current" | string = "current"): Promise<Organization[]> => {
      const response = await primitives.get(`/user/${id}/organizations`);
      return organizationSchema.array().parse(response);
    },

    getUserServices: async (
      id: "current" | string = "current",
      page: number = 1,
      limit: number = 10,
    ): Promise<Service[]> => {
      const response = await primitives.get(
        `/user/${id}/services?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return serviceSchema.array().parse(response);
    },

    getUserOrders: async (
      id: "current" | string = "current",
      filter?: OrderStatus,
      page: number = 1,
      limit: number = 10,
    ): Promise<Order[]> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filter) params.append("filter", filter);
      const response = await primitives.get(`/user/${id}/orders?${params}`);
      return orderSchema.array().parse(response);
    },

    getUserOrderStatistics: async (id: "current" | string = "current") => {
      const response = await primitives.get(`/user/${id}/orders/statistics`);
      return z
        .object({
          totalOrders: z.number(),
          pendingConfirmation: z.number(),
          pendingCompletion: z.number(),
          completedOrders: z.number(),
        })
        .parse(response);
    },

    getUserInvoices: async (
      id: "current" | string = "current",
      page: number = 1,
      limit: number = 10,
      status?: string,
    ): Promise<OrderInvoice[]> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) params.append("status", status);
      const response = await primitives.get(`/user/${id}/invoices?${params}`);
      return orderInvoiceSchema.array().parse(response);
    },

    getUserInvoiceStatistics: async (id: "current" | string = "current") => {
      const response = await primitives.get(`/user/${id}/invoices/statistics`);
      return z
        .object({
          totalInvoices: z.number(),
          draftInvoices: z.number(),
          openInvoices: z.number(),
          paidInvoices: z.number(),
          totalAmount: z.number(),
          paidAmount: z.number(),
        })
        .parse(response);
    },

    getUserPosts: async (
      id: "current" | string = "current",
      page: number = 1,
      limit: number = 10,
    ): Promise<CommunityPost[]> => {
      const response = await primitives.get(
        `/user/${id}/posts?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityPostSchema.array().parse(response);
    },

    getUserProposals: async (
      id: "current" | string = "current",
      page: number = 1,
      limit: number = 10,
    ): Promise<CommunityProposal[]> => {
      const response = await primitives.get(
        `/user/${id}/proposals?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityProposalSchema.array().parse(response);
    },

    getUserFollowers: async (
      id: "current" | string = "current",
      page: number = 1,
      limit: number = 10,
    ): Promise<User[]> => {
      const response = await primitives.get(
        `/user/${id}/followers?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return userSchema.array().parse(response);
    },

    getUserFollowings: async (
      id: "current" | string = "current",
      page: number = 1,
      limit: number = 10,
    ): Promise<User[]> => {
      const response = await primitives.get(
        `/user/${id}/followings?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return userSchema.array().parse(response);
    },

    followUser: async (id: string): Promise<User> => {
      const response = await primitives.post(`/user/${id}/follow`);
      return userSchema.parse(response);
    },

    unfollowUser: async (id: string): Promise<User> => {
      const response = await primitives.post(`/user/${id}/unfollow`);
      return userSchema.parse(response);
    },
  };
}
