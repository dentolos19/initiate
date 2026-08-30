import { z } from "zod";

import { Order, OrderInvoice, orderInvoiceSchema, orderSchema } from "#/lib/backend/connectors/orders";
import { BackendPrimitives } from "#/lib/backend/primitives";
import {
  OrderStatus,
  Service,
  ServicePlan,
  servicePlanSchema,
  ServiceReview,
  serviceReviewSchema,
  serviceSchema,
} from "#/lib/backend/schema";

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    queryServices: async (query?: string, page: number = 1, limit: number = 10): Promise<Service[]> => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (query) {
        params.append("query", query);
      }
      const response = await primitives.get(`/service?${params}`);
      return serviceSchema.array().parse(response);
    },

    searchServices: async (query: string, page: number = 1, limit: number = 10): Promise<Service[]> => {
      const response = await primitives.get(
        `/service/search?${new URLSearchParams({
          query: query,
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return serviceSchema.array().parse(response);
    },

    latestServices: async (page: number = 1, limit: number = 10): Promise<Service[]> => {
      const response = await primitives.get(
        `/service/latest?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return serviceSchema.array().parse(response);
    },

    popularServices: async (page: number = 1, limit: number = 10): Promise<Service[]> => {
      const response = await primitives.get(
        `/service/popular?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return serviceSchema.array().parse(response);
    },

    relevantServices: async (page: number = 1, limit: number = 10): Promise<Service[]> => {
      const response = await primitives.get(
        `/service/relevant?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return serviceSchema.array().parse(response);
    },

    similarServices: async (id: string): Promise<Service[]> => {
      const response = await primitives.get(`/service/${id}/similar`);
      return serviceSchema.array().parse(response);
    },

    // Services

    createService: async (organizationId: string, data: any): Promise<Service> => {
      const response = await primitives.post("/service", {
        ...data,
        organizationId,
      });
      return serviceSchema.parse(response);
    },

    updateService: async (id: string, data: any): Promise<Service> => {
      const response = await primitives.put(`/service/${id}`, data);
      return serviceSchema.parse(response);
    },

    getService: async (id: string): Promise<Service> => {
      const response = await primitives.get(`/service/${id}`);
      return serviceSchema.parse(response);
    },

    deleteService: async (id: string): Promise<void> => {
      await primitives.delete(`/service/${id}`);
    },

    getServiceOrders: async (id: string, filter?: OrderStatus): Promise<Order[]> => {
      const params = new URLSearchParams();
      if (filter) params.append("filter", filter);
      const response = await primitives.get(`/service/${id}/orders?${params}`);
      return orderSchema.array().parse(response);
    },

    getSimilarServices: async (id: string): Promise<Service[]> => {
      const response = await primitives.get(`/service/${id}/similar`);
      return serviceSchema.array().parse(response);
    },

    likeService: async (id: string): Promise<void> => {
      await primitives.post(`/service/${id}/like`);
    },

    unlikeService: async (id: string): Promise<void> => {
      await primitives.post(`/service/${id}/unlike`);
    },

    // Service Plans

    createServicePlan: async (serviceId: string, data: any): Promise<ServicePlan> => {
      const response = await primitives.post(`/service/${serviceId}/plans`, data);
      return servicePlanSchema.parse(response);
    },

    updateServicePlan: async (serviceId: string, planId: string, data: any): Promise<ServicePlan> => {
      const response = await primitives.put(`/service/${serviceId}/plans/${planId}`, data);
      return servicePlanSchema.parse(response);
    },

    getServicePlan: async (serviceId: string, planId: string): Promise<ServicePlan> => {
      const response = await primitives.get(`/service/${serviceId}/plans/${planId}`);
      return servicePlanSchema.parse(response);
    },

    deleteServicePlan: async (serviceId: string, planId: string): Promise<void> => {
      await primitives.delete(`/service/${serviceId}/plans/${planId}`);
    },

    orderServicePlan: async (
      serviceId: string,
      planId: string,
      data: any,
    ): Promise<{ message: string; order: Record<string, unknown>; invoice: OrderInvoice }> => {
      const response = await primitives.post(`/service/${serviceId}/plans/${planId}/order`, data);
      return z
        .object({ message: z.string(), order: z.record(z.unknown()), invoice: orderInvoiceSchema })
        .parse(response);
    },

    getServicePlans: async (serviceId: string): Promise<ServicePlan[]> => {
      const response = await primitives.get(`/service/${serviceId}/plans`);
      return servicePlanSchema.array().parse(response);
    },

    // Service Reviews

    createServiceReview: async (serviceId: string, data: any): Promise<ServiceReview> => {
      const response = await primitives.post(`/service/${serviceId}/reviews`, data);
      return serviceReviewSchema.parse(response);
    },

    updateServiceReview: async (serviceId: string, reviewId: string, data: any): Promise<ServiceReview> => {
      const response = await primitives.put(`/service/${serviceId}/reviews/${reviewId}`, data);
      return serviceReviewSchema.parse(response);
    },

    getServiceReviews: async (serviceId: string): Promise<ServiceReview[]> => {
      const response = await primitives.get(`/service/${serviceId}/reviews`);
      return serviceReviewSchema.array().parse(response);
    },

    deleteServiceReview: async (serviceId: string, reviewId: string): Promise<void> => {
      await primitives.delete(`/service/${serviceId}/reviews/${reviewId}`);
    },
  };
}
