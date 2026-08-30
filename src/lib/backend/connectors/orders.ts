import z from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";
import { currencySchema, organizationSchema, servicePlanSchema, serviceSchema, userSchema } from "#/lib/backend/schema";

export const orderMilestoneStatusSchema = z.enum(["draft", "pending", "in_progress", "completed", "cancelled"]);

export type OrderMilestoneStatus = z.infer<typeof orderMilestoneStatusSchema>;

export const orderSchema = z.object({
  id: z.string(),
  userId: z.string().nullish(),
  organizationId: z.string().nullish(),
  serviceId: z.string().nullish(),
  planId: z.string().nullish(),
  name: z.string(),
  status: z.string(),
  description: z.string().nullish(),
  instructions: z.string().nullish(),
  dueAt: z.string().datetime().nullish(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),

  // Relationships
  user: userSchema.nullish(),
  organization: organizationSchema.nullish(),
  service: serviceSchema.extend({ organization: organizationSchema.nullish() }).nullish(),
  plan: servicePlanSchema.nullish(),
});

export const orderInvoiceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  orderId: z.string(),
  milestoneId: z.string().nullish(),
  stripeAccountId: z.string(),
  stripeCustomerId: z.string(),
  stripeInvoiceId: z.string(),
  status: z.string(),
  currency: currencySchema,
  amount: z.number().int(),
  description: z.string().nullish(),
  url: z.string().nullish(),
  dueAt: z.string().nullish(),
  paidAt: z.string().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Relationships
  order: orderSchema.nullish(),
});

export const orderMilestoneSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  name: z.string(),
  content: z.string().nullish(),
  status: orderMilestoneStatusSchema,
  dueAt: z.string().datetime().nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Relationships
  order: orderSchema.nullish(),
  invoices: orderInvoiceSchema.array().default([]),
});

export type Order = z.infer<typeof orderSchema>;
export type OrderInvoice = z.infer<typeof orderInvoiceSchema>;
export type OrderMilestone = z.infer<typeof orderMilestoneSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    getOrder: async (orderId: string): Promise<Order> => {
      const response = await primitives.get(`/orders/${orderId}`);
      return orderSchema.parse(response);
    },

    getOrderInvoices: async (orderId: string): Promise<OrderInvoice[]> => {
      const response = await primitives.get(`/orders/${orderId}/invoices`);
      return orderInvoiceSchema.array().parse(response);
    },

    proposeOrder: async (orderId: string): Promise<Order> => {
      const response = await primitives.patch(`/orders/${orderId}/status`, { status: "proposed" });
      return orderSchema.parse(response);
    },

    confirmOrder: async (orderId: string): Promise<Order> => {
      const response = await primitives.patch(`/orders/${orderId}/status`, { status: "confirmed" });
      return orderSchema.parse(response);
    },

    completeOrder: async (orderId: string): Promise<Order> => {
      const response = await primitives.patch(`/orders/${orderId}/status`, { status: "completed" });
      return orderSchema.parse(response);
    },

    cancelOrder: async (orderId: string): Promise<Order> => {
      const response = await primitives.patch(`/orders/${orderId}/status`, { status: "cancelled" });
      return orderSchema.parse(response);
    },

    rejectOrder: async (orderId: string): Promise<Order> => {
      const response = await primitives.patch(`/orders/${orderId}/status`, { status: "rejected" });
      return orderSchema.parse(response);
    },

    // Invoices

    createOrderInvoice: async (orderId: string, data: any): Promise<OrderInvoice> => {
      const response = await primitives.post(`/orders/${orderId}/invoices`, data);
      return orderInvoiceSchema.parse(response);
    },

    updateOrderInvoice: async (invoiceId: string, data: any): Promise<OrderInvoice> => {
      const response = await primitives.put(`/orders/invoices/${invoiceId}`, data);
      return orderInvoiceSchema.parse(response);
    },

    deleteOrderInvoice: async (invoiceId: string): Promise<void> => {
      await primitives.delete(`/orders/invoices/${invoiceId}`);
    },

    finalizeOrderInvoice: async (invoiceId: string): Promise<OrderInvoice> => {
      const response = await primitives.post(`/orders/invoices/${invoiceId}/finalize`);
      return orderInvoiceSchema.parse(response);
    },

    // Milestones

    getOrderMilestones: async (orderId: string): Promise<OrderMilestone[]> => {
      const response = await primitives.get(`/orders/${orderId}/milestones`);
      return orderMilestoneSchema.array().parse(response);
    },

    getOrderMilestone: async (orderId: string, milestoneId: string): Promise<OrderMilestone> => {
      const response = await primitives.get(`/orders/${orderId}/milestones/${milestoneId}`);
      return orderMilestoneSchema.parse(response);
    },

    createOrderMilestone: async (orderId: string, data: any): Promise<OrderMilestone> => {
      const response = await primitives.post(`/orders/${orderId}/milestones`, data);
      return orderMilestoneSchema.parse(response);
    },

    updateOrderMilestone: async (orderId: string, milestoneId: string, data: any): Promise<OrderMilestone> => {
      const response = await primitives.put(`/orders/${orderId}/milestones/${milestoneId}`, data);
      return orderMilestoneSchema.parse(response);
    },

    updateOrderMilestoneStatus: async (
      orderId: string,
      milestoneId: string,
      status: string,
    ): Promise<OrderMilestone> => {
      const response = await primitives.patch(`/orders/${orderId}/milestones/${milestoneId}`, { status });
      return orderMilestoneSchema.parse(response);
    },

    deleteOrderMilestone: async (orderId: string, milestoneId: string): Promise<void> => {
      await primitives.delete(`/orders/${orderId}/milestones/${milestoneId}`);
    },
  };
}
