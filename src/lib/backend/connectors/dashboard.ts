import { z } from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

// dashboard schemas
export const dashboardMetricsSchema = z.object({
  totalRevenue: z.string(),
  mrr: z.string(),
  totalTransactions: z.number(),
  avgOrderValue: z.string(),
});

export const dashboardChartDataSchema = z.object({
  day: z.number(),
  revenue: z.number().optional(),
  signups: z.number().optional(),
  date: z.string(),
});

export const dashboardServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  sales: z.number(),
  revenue: z.string(),
});

export const dashboardTransactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  customer: z.string(),
  service: z.string(),
  plan: z.string(),
  amount: z.string(),
  status: z.string(),
});

export const dashboardAdminStatsSchema = z.object({
  users: z.number(),
  organizations: z.number(),
  services: z.number(),
  orders: z.number(),
  platformRevenue: z.string(),
});

export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type DashboardChartData = z.infer<typeof dashboardChartDataSchema>;
export type DashboardService = z.infer<typeof dashboardServiceSchema>;
export type DashboardTransaction = z.infer<typeof dashboardTransactionSchema>;
export const dashboardInsightsSchema = z.object({
  insights: z.string(),
  dataAnalyzed: z.object({
    totalRevenue: z.number(),
    totalTransactions: z.number(),
    servicesAnalyzed: z.number(),
    businessStage: z.string(),
  }),
});

export type DashboardInsights = z.infer<typeof dashboardInsightsSchema>;

export default function mapConnectors_dashboard(primitives: BackendPrimitives) {
  return {
    getMetrics: async (): Promise<DashboardMetrics> => {
      const response = await primitives.get("/dashboard/metrics");
      return dashboardMetricsSchema.parse(response);
    },

    getRevenueChart: async (): Promise<DashboardChartData[]> => {
      const response = await primitives.get("/dashboard/charts/revenue");
      return z.array(dashboardChartDataSchema).parse(response);
    },

    getSignupsChart: async (): Promise<DashboardChartData[]> => {
      const response = await primitives.get("/dashboard/charts/signups");
      return z.array(dashboardChartDataSchema).parse(response);
    },

    getTopServices: async (): Promise<DashboardService[]> => {
      const response = await primitives.get("/dashboard/services/top");
      return z.array(dashboardServiceSchema).parse(response);
    },

    getRecentTransactions: async (): Promise<DashboardTransaction[]> => {
      const response = await primitives.get("/dashboard/transactions/recent");
      return z.array(dashboardTransactionSchema).parse(response);
    },

    getInsights: async (): Promise<DashboardInsights> => {
      const response = await primitives.get("/dashboard/insights");
      return dashboardInsightsSchema.parse(response);
    },
  };
}
