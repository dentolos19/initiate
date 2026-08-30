import { generateText } from "ai";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { serviceCountExtras } from "#/lib/database/query-fragments.js";
import { order, organization as organizationTable, service, user as userTable } from "#/lib/database/schema.js";
import { generationModel } from "#/lib/server/integrations/ai.js";
import { database } from "#/lib/server/integrations/database.js";
import { getOrganization, getUser } from "#/lib/server/lib/utils.js";

const dashboard = new Hono();

//  core financial metrics
dashboard.get("/metrics", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const whereClause = organization ? { order: { service: { organizationId: organization.id } } } : {};

  try {
    //  total revenue from paid invoices
    const paidInvoices = await database.query.orderInvoice.findMany({
      where: {
        ...whereClause,
        status: "paid",
      },
      columns: {
        amount: true,
        currency: true,
        paidAt: true,
      },
    });

    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    //  total transactions orders
    const totalTransactions = await database.$count(
      order,
      organization ? eq(order.organizationId, organization.id) : undefined,
    );

    //  average order value
    const avgOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    //  MRR
    // revenue from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = await database.query.orderInvoice.findMany({
      where: {
        ...whereClause,
        status: "paid",
        paidAt: {
          gte: thirtyDaysAgo,
        },
      },
      columns: {
        amount: true,
      },
    });

    const monthlyRevenue = recentInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    return c.json({
      totalRevenue: (totalRevenue / 100).toFixed(2), // Convert from cents
      mrr: (monthlyRevenue / 100).toFixed(2),
      totalTransactions,
      avgOrderValue: (avgOrderValue / 100).toFixed(2),
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return c.json({ error: "Failed to fetch metrics" }, 500);
  }
});

//  revenue chart data (last 7 days)
dashboard.get("/charts/revenue", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const whereClause = organization ? { order: { service: { organizationId: organization.id } } } : {};

  try {
    //  last 7 days of revenue
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    //  invoices with dates for grouping
    const invoices = await database.query.orderInvoice.findMany({
      where: {
        ...whereClause,
        status: "paid",
        paidAt: {
          gte: sevenDaysAgo,
        },
      },
      columns: {
        amount: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    const dailyRevenue: { [key: string]: number } = {};

    invoices.forEach((invoice) => {
      if (invoice.paidAt) {
        const date = invoice.paidAt.toISOString().split("T")[0];
        dailyRevenue[date] = (dailyRevenue[date] || 0) + invoice.amount;
      }
    });

    const chartData = Object.entries(dailyRevenue).map(([date, amount], index) => ({
      day: index + 1,
      revenue: amount / 100,
      date: date,
    }));

    return c.json(chartData);
  } catch (error) {
    console.error("Revenue chart error:", error);
    return c.json({ error: "Failed to fetch revenue data" }, 500);
  }
});

//  user signups chart data last 7 days
dashboard.get("/charts/signups", async (c) => {
  const user = await getUser(c);

  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  try {
    //  7 days of user signups
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await database.query.user.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      columns: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const dailySignups: { [key: string]: number } = {};

    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0];
      dailySignups[date] = (dailySignups[date] || 0) + 1;
    });

    const chartData = Object.entries(dailySignups).map(([date, count], index) => ({
      day: index + 1,
      signups: count,
      date: date,
    }));

    return c.json(chartData);
  } catch (error) {
    console.error("Signups chart error:", error);
    return c.json({ error: "Failed to fetch signup data" }, 500);
  }
});

//  top-selling services
dashboard.get("/services/top", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const whereClause = organization ? { organizationId: organization.id } : {};

  try {
    //  services with order counts and revenue
    const topServices = await database.query.service.findMany({
      where: whereClause,
      extras: serviceCountExtras,
      with: {
        orders: {
          with: {
            invoices: {
              where: {
                status: "paid",
              },
              columns: {
                amount: true,
              },
            },
          },
        },
      },
      limit: 10,
    });

    // calculate revenue per service
    const servicesWithRevenue = topServices.map((service) => {
      const totalRevenue = service.orders.reduce((sum, order) => {
        return sum + order.invoices.reduce((orderSum, invoice) => orderSum + invoice.amount, 0);
      }, 0);

      return {
        id: service.id,
        name: service.name,
        sales: service.ordersCount,
        revenue: (totalRevenue / 100).toFixed(2), // convert from cents
      };
    });

    // sort by revenue
    servicesWithRevenue.sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    return c.json(servicesWithRevenue);
  } catch (error) {
    console.error("Top services error:", error);
    return c.json({ error: "Failed to fetch top services" }, 500);
  }
});

// get recent transactions
dashboard.get("/transactions/recent", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const whereClause = organization ? { service: { organizationId: organization.id } } : {};

  try {
    const recentOrders = await database.query.order.findMany({
      where: whereClause,
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
          },
        },
        service: {
          columns: {
            name: true,
          },
        },
        plan: {
          columns: {
            name: true,
          },
        },
        invoices: {
          columns: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      limit: 10,
    });

    const formattedOrders = recentOrders.map((order) => {
      const totalAmount = order.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);

      return {
        id: order.id,
        date: order.createdAt.toISOString().split("T")[0],
        customer: order.user ? `${order.user.firstName} ${order.user.lastName}` : "Unknown",
        service: order.service?.name ?? "Unknown",
        plan: order.plan?.name || "Custom",
        amount: `$${(totalAmount / 100).toFixed(2)}`,
        status: order.status,
      };
    });

    return c.json(formattedOrders);
  } catch (error) {
    console.error("Recent transactions error:", error);
    return c.json({ error: "Failed to fetch recent transactions" }, 500);
  }
});

//  platform-wide statistics (admin only)
dashboard.get("/admin/stats", async (c) => {
  const user = await getUser(c);

  if (!user || user.type !== "admin") {
    return c.json({ error: "Admin access required." }, 403);
  }

  try {
    const [totalUsers, totalOrganizations, totalServices, totalOrders, paidInvoices] = await Promise.all([
      database.$count(userTable),
      database.$count(organizationTable),
      database.$count(service),
      database.$count(order),
      database.query.orderInvoice.findMany({ where: { status: "paid" }, columns: { amount: true } }),
    ]);
    const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    return c.json({
      users: totalUsers,
      organizations: totalOrganizations,
      services: totalServices,
      orders: totalOrders,
      platformRevenue: (totalRevenue / 100).toFixed(2),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return c.json({ error: "Failed to fetch admin stats" }, 500);
  }
});

//  comprehensive insights for AI analysis
dashboard.get("/insights", async (c) => {
  const user = await getUser(c);
  const organization = await getOrganization(c);

  if (!user) {
    return c.json({ error: "Unauthorized." }, 401);
  }

  const whereClause = organization ? { order: { service: { organizationId: organization.id } } } : {};

  try {
    //  comprehensive dashboard data for AI analysis
    const [metrics, services, recentOrders, monthlyTrends] = await Promise.all([
      // basic metrics
      (async () => {
        const paidInvoices = await database.query.orderInvoice.findMany({
          where: { ...whereClause, status: "paid" },
          columns: { amount: true, currency: true, paidAt: true },
        });
        const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
        const totalTransactions = await database.$count(
          order,
          organization ? eq(order.organizationId, organization.id) : undefined,
        );
        return { totalRevenue: totalRevenue / 100, totalTransactions };
      })(),

      // service performance
      database.query.service.findMany({
        where: organization ? { organizationId: organization.id } : {},
        extras: serviceCountExtras,
        with: {
          orders: {
            with: {
              invoices: { where: { status: "paid" }, columns: { amount: true } },
            },
          },
        },
        limit: 10,
      }),

      // recent activity
      database.query.order.findMany({
        where: organization ? { service: { organizationId: organization.id } } : {},
        with: { service: { columns: { name: true } } },
        orderBy: { createdAt: "desc" },
        limit: 20,
      }),

      // monthly trend data
      (async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const lastMonthInvoices = await database.query.orderInvoice.findMany({
          where: {
            ...whereClause,
            status: "paid",
            paidAt: { gte: lastMonth },
          },
          columns: { amount: true, paidAt: true },
        });

        return lastMonthInvoices.reduce((sum, invoice) => sum + invoice.amount, 0) / 100;
      })(),
    ]);

    // data for analysis
    // Consolidate all fetched metrics and derived analytics into a single object
    // - totalRevenue: overall paid invoice revenue
    // - totalTransactions: count of all service orders
    // - avgOrderValue: average revenue per order
    // - monthlyRevenue: revenue from the past 30 days
    // - servicesCount: number of services analyzed
    // - topServices: top 5 services by revenue, each with name, order count, and revenue
    // - recentActivity: details of the 10 most recent orders (service name, status, date)
    // - businessStage: automatically classified as "startup", "early", "growth", or "established"
    const dashboardData = {
      totalRevenue: metrics.totalRevenue,
      totalTransactions: metrics.totalTransactions,
      avgOrderValue: metrics.totalTransactions > 0 ? metrics.totalRevenue / metrics.totalTransactions : 0,
      monthlyRevenue: monthlyTrends,
      servicesCount: services.length,
      topServices: services
        .map((service) => ({
          name: service.name,
          orders: service.ordersCount,
          revenue:
            service.orders.reduce(
              (sum, order) => sum + order.invoices.reduce((orderSum, invoice) => orderSum + invoice.amount, 0),
              0,
            ) / 100,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5),
      recentActivity: recentOrders.slice(0, 10).map((order) => ({
        service: order.service?.name ?? "Unknown",
        status: order.status,
        date: order.createdAt.toISOString().split("T")[0],
      })),
      businessStage:
        metrics.totalRevenue === 0
          ? "startup"
          : metrics.totalRevenue < 1000
            ? "early"
            : metrics.totalRevenue < 10000
              ? "growth"
              : "established",
    };

    //  insights
    const orgs = await database.query.organization.findFirst({
      where: { id: organization?.id || "" },
    });

    const result = await generateText({
      model: generationModel,
      prompt: `
    You are an expert business growth consultant analyzing a ${dashboardData.businessStage}-stage startup's performance metrics. Your goal is to provide actionable, data-driven insights that will directly impact their bottom line.
    And this is the genral company data for contrext ${JSON.stringify(orgs)}

    **Company Performance Data:**
    ${JSON.stringify(dashboardData, null, 2)}

    **Context:**
    - Business Stage: ${dashboardData.businessStage} (startup = $0 revenue, early = <$1k, growth = <$10k, established = $10k+)
    - Time Period: Last 30 days of operation
    - Current Date: ${new Date().toISOString().split("T")[0]}

    **Your Analysis Should Include:**

    **1. Key Observations** (2-3 bullet points)
    - identify the most significant patterns or anomalies in their data
    - highlight what's working well and what needs immediate attention
    - compare their metrics to typical ${dashboardData.businessStage}-stage benchmarks

    **2. Growth Actions** (2-3 specific strategies)
    Based on their current metrics, provide concrete steps such as:
    - if low revenue: Customer acquisition tactics (e.g., "Launch a 14-day free trial for ${dashboardData.topServices[0]?.name || "your top service"}")
    - if good revenue but few transactions: Upselling strategies
    - if many transactions but low AOV: Pricing optimization suggestions
    - service-specific recommendations based on their top performers

    **3. Actionable Steps** (1-2 some not too complex things that can be done)
    - prioritize based on potential impact and ease of implementation
    - be specific enough that they can assign these to team members
    - include metrics to track success (e.g., "Aim for 5 new signups by Friday")

    **Important Guidelines:**
    - use their actual service names when making recommendations
    - ensure that u look through their description and understand what their service does like how it provdes value
    - if they have $0 revenue, focus entirely on validation and first customer acquisition
    - if they have traction (${dashboardData.totalTransactions} transactions), focus on optimization and scaling
    - avoid generic advice - make it specific to their data (${JSON.stringify(orgs)})
    - keep language encouraging but realistic
    - total response should be 3-4 concise paragraphs with clear formatting
    - use **bold** for section headers and key metrics
    - don't use generic advice - make it specific to their data


    **Tone:** Professional yet approachable, like a trusted advisor who understands startups
  `,
    });

    return c.json({
      insights: result.text,
      dataAnalyzed: {
        totalRevenue: dashboardData.totalRevenue,
        totalTransactions: dashboardData.totalTransactions,
        servicesAnalyzed: dashboardData.servicesCount,
        businessStage: dashboardData.businessStage,
      },
    });
  } catch (error) {
    console.error("Dashboard insights error:", error);
    return c.json({ error: "Failed to generate insights" }, 500);
  }
});

export default dashboard;
