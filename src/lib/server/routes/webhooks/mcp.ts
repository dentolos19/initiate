// @ts-nocheck -- The MCP SDK's recursive tool schema types exceed TypeScript's instantiation limit.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import { Hono } from "hono";
import { z } from "zod";

import { PLATFORM_URL } from "#/lib/server/environment.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { searchServices, searchOrganizations, searchGrants, createCommunityPost } from "#/lib/server/lib/utils.js";
import type { AppContext } from "#/lib/server/types.js";

const getServer = (context: AppContext) => {
  const server = new McpServer(
    {
      name: "initiate-mcp",
      version: "2.0",
    },
    {
      capabilities: {
        logging: {},
        tools: {
          listChanged: true,
        },
      },
    },
  );

  // Search services
  server.tool(
    "searchServices",
    "Search for AI services and solutions on the Initiate platform.",
    {
      query: z.string().describe("The search query to find services (e.g., 'chatbot', 'data analytics', 'voice AI')"),
      limit: z.number().optional().default(5).describe("Number of results to return (1-20)"),
      type: z.enum(["api", "saas", "mcp", "other"]).optional().describe("Filter by service type"),
    },
    async ({ query, limit = 5, type }) => {
      const services = await searchServices(context, query, 1, Math.min(limit, 20));

      const filteredServices = type ? services.filter((service) => service.type === type) : services;

      if (!filteredServices || filteredServices.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No services found for "${query}"${type ? ` of type "${type}"` : ""}.`,
            },
          ],
        };
      }

      //       const resultsText = filteredServices
      //         .map((service) => {
      //           const verifiedBadge = service.verified ? " ✅" : "";
      //           const popularityScore = (service.likes || 0) + (service.orders || 0) * 2;

      //           return `**${service.name}**${verifiedBadge} (${service.type})
      // 📝 ${service.tagline || "Professional AI service"}
      // ⭐ ${service.likes || 0} likes • 📦 ${service.orders || 0} orders • 🔥 Score: ${popularityScore}
      // 🏷️ Tags: ${service.tags?.join(", ") || "General AI"}
      // 🔗 View: https://initiate.platform/services/${service.id}
      // ${service.verified ? "🛡️ Verified Organization" : ""}`;
      //         })
      //         .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${services.length} services for "${query}":\n\n${services
              .map(
                (service) =>
                  `**${service.name}** (${service.type})\n${service.tagline || "No tagline"}\n- ${service.likes} likes, ${service.orders} orders\n- Tags: ${service.tags.join(", ") || "None"}\n- View: ${PLATFORM_URL}/services/${service.id}\n`,
              )
              .join("\n")}`,
          },
        ],
      };
    },
  );

  // Search grants
  server.tool(
    "searchGrants",
    "Search for grants and funding opportunities.",
    {
      query: z.string().describe("The search query to find grants and funding opportunities."),
    },
    async ({ query }) => {
      const grants = await searchGrants(context, query);

      if (!grants || grants.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No grants found for "${query}".`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Found ${grants.length} grants for "${query}":\n\n${grants
              .map(
                (grant) =>
                  `**${grant.name}** by ${grant.provider}\n${grant.description || "No description"}\n- Location: ${grant.location || "Not specified"}\n- Grant Amount: ${grant.grant || "Not specified"}\n- Deadline: ${grant.deadlineAt ? new Date(grant.deadlineAt).toLocaleDateString() : "Not specified"}\n- Apply: ${grant.applyUrl || grant.websiteUrl || "Contact provider"}\n - View: ${PLATFORM_URL}/resources\n`,
              )
              .join("\n")}`,
          },
        ],
      };
    },
  );

  // Search organizations
  server.tool(
    "searchOrganizations",
    "Search for organizations and companies on the Initiate platform.",
    {
      query: z.string().describe("The search query to find organizations"),
      limit: z.number().optional().default(5).describe("Number of results to return"),
    },
    async ({ query, limit = 5 }) => {
      const organizations = await searchOrganizations(context, query, 1, limit);

      if (!organizations || organizations.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No organizations found for "${query}".`,
            },
          ],
        };
      }

      const resultsText = organizations
        .map((org) => {
          const verifiedBadge = org.verified ? " ✅" : "";

          return `**${org.name}**${verifiedBadge}
          📝 ${org.description || "Professional organization on Initiate"}
          ❤️ ${org.likes || 0} likes
          🔗 View: https://initiate.platform/organizations/${org.id}
          ${org.verified ? "🛡️ Verified Organization" : ""}`;
        })
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${organizations.length} organizations for "${query}":\n\n${resultsText}`,
          },
        ],
      };
    },
  );

  // Get orders
  server.tool(
    "getMyOrders",
    "Get the user's orders from the platform with optional status filtering.",
    {
      user_id: z.string().optional().describe("The authenticated user's ID from dynamic variables"),
      status: z
        .enum(["pending", "confirmed", "completed", "all"])
        .optional()
        .default("all")
        .describe("Filter orders by status"),
      limit: z.number().optional().default(5).describe("Number of recent orders to return"),
    },
    async ({ user_id, status, limit = 5 }) => {
      try {
        const userId = user_id || getAuth(context)?.userId;
        if (!userId) {
          return {
            content: [
              {
                type: "text",
                text: "I'd love to help you check your orders! Please log in to your account first, then ask me again.",
              },
            ],
          };
        }

        const whereClause: any = {
          userId: userId,
        };

        if (status !== "all") {
          whereClause.status = status;
        }

        const orders = await database.query.order.findMany({
          where: whereClause,
          limit: limit,
          orderBy: {
            createdAt: "desc",
          },
          with: {
            service: {
              columns: {
                name: true,
                type: true,
              },
            },
            organization: {
              columns: {
                name: true,
                verified: true,
              },
            },
          },
        });

        if (orders.length === 0) {
          const statusText = status === "all" ? "" : ` ${status}`;
          return {
            content: [
              {
                type: "text",
                text: `You don't have any${statusText} orders yet. Ready to explore some AI services? Just ask me to search for something specific!`,
              },
            ],
          };
        }

        // Create more conversational response
        const statusText = status === "all" ? "recent" : status;
        const ordersText = orders
          .map((order) => {
            const statusEmoji =
              {
                pending: "⏳",
                confirmed: "✅",
                completed: "🎉",
              }[order.status] || "📋";

            const verifiedBadge = order.organization?.verified ? " ✅" : "";
            const orderDate = new Date(order.createdAt).toLocaleDateString();

            return `${statusEmoji} **${order.service?.name || "Service"}**
🏢 ${order.organization?.name || "Unknown Organization"}${verifiedBadge}
📅 Ordered: ${orderDate}
💰 Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
🔗 Order ID: ${order.id}`;
          })
          .join("\n\n");

        const summary = `Here are your ${statusText} orders (${orders.length} total):`;
        const footer =
          status === "pending"
            ? "\n\n💡 Need help with any pending orders? Just ask!"
            : status === "completed"
              ? "\n\n🎉 Great job completing these orders! Need anything else?"
              : "\n\n💬 Want to check a specific order or need help with something? Just let me know!";

        return {
          content: [
            {
              type: "text",
              text: `${summary}\n\n${ordersText}${footer}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Oops! I ran into an issue getting your orders: ${message}. Let me try again in a moment.`,
            },
          ],
        };
      }
    },
  );

  // Get analytics for organization
  server.tool(
    "getMyAnalytics",
    "Get business analytics and performance metrics for the user's organization.",
    {
      user_id: z.string().optional().describe("The authenticated user's ID from dynamic variables"),
      organization_id: z.string().optional().describe("The current organization's ID from dynamic variables"),
      period: z.enum(["week", "month", "quarter"]).optional().default("month").describe("Time period for analytics"),
    },
    async ({ user_id, organization_id, period = "month" }) => {
      try {
        const userId = user_id || getAuth(context)?.userId;
        const organization = await database.query.organization.findFirst({ where: { id: organization_id } });

        if (!userId || !organization) {
          return {
            content: [
              {
                type: "text",
                text: "You need to be logged in with an organization to view analytics.",
              },
            ],
          };
        }

        // Calculate date range
        const now = new Date();
        const daysBack = period === "week" ? 7 : period === "month" ? 30 : 90;
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

        // Get orders for the organization's services
        const orders = await database.query.order.findMany({
          where: {
            service: {
              organizationId: organization.id,
            },
            createdAt: {
              gte: startDate,
            },
          },
          with: {
            service: {
              columns: {
                name: true,
              },
            },
          },
        });

        // Get paid invoices for revenue
        const paidInvoices = await database.query.orderInvoice.findMany({
          where: {
            order: {
              service: {
                organizationId: organization.id,
              },
            },
            status: "paid",
            paidAt: {
              gte: startDate,
            },
          },
        });
        const totalRevenue = paidInvoices.reduce((sum: number, invoice: any) => sum + (invoice.amount || 0), 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Count by status
        const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
        const confirmedOrders = orders.filter((o: any) => o.status === "confirmed").length;
        const completedOrders = orders.filter((o: any) => o.status === "completed").length;

        return {
          content: [
            {
              type: "text",
              text: `📊 **${organization.name} Analytics** (Last ${period})

💰 **Revenue:** $${(totalRevenue / 100).toFixed(2)}
📦 **Total Orders:** ${totalOrders}
💵 **Avg Order Value:** $${(avgOrderValue / 100).toFixed(2)}

📋 **Order Status:**
⏳ Pending: ${pendingOrders}
✅ Confirmed: ${confirmedOrders}
🎉 Completed: ${completedOrders}

🔥 **Performance:** ${completedOrders > 0 ? "Strong completion rate!" : "Focus on completing pending orders"}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching analytics: ${message}`,
            },
          ],
        };
      }
    },
  );

  /*
// server.tool(
//   "getNotifications",
//   "Get the user's notifications from the platform.",
//   {
//     user_id: z.string().optional().describe("The authenticated user's ID from dynamic variables"),
//     filter: z.enum(["inbox", "archived", "all"]).optional().default("inbox").describe("Filter notifications by status"),
//     limit: z.number().optional().default(5).describe("Number of notifications to return"),
//   },
//   async ({ user_id, filter = "inbox", limit = 5 }) => {
//     try {
//       const userId = user_id || getAuth(context)?.userId;
//       if (!userId) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: "You need to be logged in to view notifications.",
//             },
//           ],
//         };
//       }

//       const whereClause: any = {
//         userId: userId,
//       };

//       if (filter === "inbox") {
//         whereClause.isArchived = false;
//       } else if (filter === "archived") {
//         whereClause.isArchived = true;
//       }

//       const notifications = await database.query.notification.findMany({
//         where: whereClause,
//         limit: limit,
//         orderBy: {
//           createdAt: "desc",
//         },
//       });

//       if (notifications.length === 0) {
//         return {
//           content: [
//             {
//               type: "text",
//               text: filter === "inbox" ? "You have no new notifications." : `You have no ${filter} notifications.`,
//             },
//           ],
//         };
//       }

//       const notificationsText = notifications
//         .map((notification) => {
//           const timeAgo = new Date(notification.createdAt).toLocaleDateString();
//           const readStatus = notification.isRead ? "✅" : "🔵";

//           return `${readStatus} **${notification.title}**
// 📝 ${notification.description || "No description"}
// 📅 ${timeAgo}`;
//         })
//         .join("\n\n");

//       return {
//         content: [
//           {
//             type: "text",
//             text: `🔔 Your ${filter} notifications:\n\n${notificationsText}`,
//           },
//         ],
//       };
//     } catch (error) {
//       const message = error instanceof Error ? error.message : String(error);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error fetching notifications: ${message}`,
//           },
//         ],
//       };
//     }
//     // ...TO HERE
//   },
// );
*/
  // Get notifications
  server.tool(
    "getNotifications",
    "Get the user's notifications from the platform.",
    {
      user_id: z.string().optional().describe("The authenticated user's ID from dynamic variables"),
      filter: z
        .enum(["inbox", "archived", "all"])
        .optional()
        .default("inbox")
        .describe("Filter notifications by status"),
      limit: z.number().optional().default(5).describe("Number of notifications to return"),
    },
    async ({ user_id, filter = "inbox", limit = 5 }) => {
      console.log("🔍 getNotifications called with:", { user_id, filter, limit });

      // Simple response first - no database calls
      return {
        content: [
          {
            type: "text",
            text: `DEBUG: Received user_id = ${user_id || "EMPTY"}, filter = ${filter}`,
          },
        ],
      };
    },
  );

  // Check messages
  server.tool(
    "checkMessages",
    "Check recent messages and conversations.",
    {
      user_id: z.string().optional().describe("The authenticated user's ID from dynamic variables"),
      unreadOnly: z.boolean().optional().default(true).describe("Only show unread messages"),
      limit: z.number().optional().default(5).describe("Number of messages to return"),
    },
    async ({ user_id, unreadOnly = true, limit = 5 }) => {
      try {
        const userId = user_id || getAuth(context)?.userId;
        if (!userId) {
          return {
            content: [
              {
                type: "text",
                text: "You need to be logged in to check messages.",
              },
            ],
          };
        }

        // Messages have a `user` relation and `userId`.
        const whereClause: any = { userId: userId };

        if (unreadOnly) {
          whereClause.isRead = false;
        }

        const messages = await database.query.message.findMany({
          where: whereClause,
          limit: limit,
          orderBy: { createdAt: "desc" },
          with: {
            user: { columns: { firstName: true, lastName: true } },
          },
        });

        if (messages.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: unreadOnly ? "You have no unread messages." : "You have no recent messages.",
              },
            ],
          };
        }

        const messagesText = messages
          .map((message) => {
            const isFromMe = message.userId === userId;
            const otherPerson = isFromMe
              ? "You"
              : `${message.user?.firstName ?? ""} ${message.user?.lastName ?? ""}`.trim();
            const direction = isFromMe ? "→" : "←";
            const timeAgo = new Date(message.createdAt).toLocaleDateString();

            return `${direction} **${otherPerson || "Unknown User"}**\n💬 ${message.content.substring(0, 100)}${message.content.length > 100 ? "..." : ""}\n📅 ${timeAgo}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `💬 Your ${unreadOnly ? "unread" : "recent"} messages:\n\n${messagesText}`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error fetching messages: ${message}`,
            },
          ],
        };
      }
    },
  );

  // Create community post
  server.tool(
    "createCommunityPost",
    "Create a new community post on the Initiate platform.",
    {
      type: z
        .enum(["general", "problem-statement", "project", "service-request", "announcement", "question", "discussion"])
        .describe("The type of post to create"),
      title: z.string().describe("The title of the post"),
      content: z.string().describe("The main content/body of the post"),
      htmlContent: z.string().optional().describe("HTML formatted version of the content for better display"),
      tags: z.array(z.string()).optional().describe("Optional tags for the post"),
      budget: z.number().positive().optional().describe("Optional budget if this is a project or service request"),
      deadline: z.string().optional().describe("Optional deadline in ISO datetime format"),
    },
    async ({ type, title, content, htmlContent, tags, budget, deadline }) => {
      try {
        const result = await createCommunityPost(context, {
          type,
          title,
          content,
          htmlContent,
          tags,
          budget,
          deadline,
          confirmPost: true,
        });

        if (!result.success) {
          return {
            content: [
              {
                type: "text",
                text: `Failed to create post: ${result.message}`,
              },
            ],
          };
        }

        const postUrl = result.redirectUrl ? `${PLATFORM_URL}${result.redirectUrl}` : "";

        return {
          content: [
            {
              type: "text",
              text: `Post Created Successfully

Title: ${title}
Type: ${type}
${tags && tags.length > 0 ? `Tags: ${tags.join(", ")}\n` : ""}${budget ? `Budget: $${budget}\n` : ""}${deadline ? `Deadline: ${new Date(deadline).toLocaleDateString()}\n` : ""}View Post: ${postUrl}

Your post has been published to the community and is now visible to all users.`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error creating community post: ${message}`,
            },
          ],
        };
      }
    },
  );

  // Search services by business need
  server.tool(
    "findServicesByNeed",
    "Find AI services that match specific business problems or needs using intelligent matching.",
    {
      businessProblem: z
        .string()
        .describe("Describe the business problem or goal (e.g., 'I need to automate customer support')"),
      budget: z.string().optional().describe("Budget range (e.g., 'under $100/month')"),
      industry: z.string().optional().describe("Your industry (e.g., 'e-commerce', 'healthcare')"),
      limit: z.number().optional().default(3).describe("Number of recommendations to return"),
    },
    async ({ businessProblem, budget, industry, limit = 3 }) => {
      try {
        // Enhanced search query combining business need with context
        const searchQuery = [businessProblem, industry && `for ${industry}`, budget && `budget ${budget}`]
          .filter(Boolean)
          .join(" ");

        const services = await searchServices(context, searchQuery, 1, limit);

        if (!services || services.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `I couldn't find specific services for "${businessProblem}". Try describing your need differently or search for broader categories like "automation", "analytics", or "chatbot".`,
              },
            ],
          };
        }

        // Create simple response with found services
        const resultsText = services
          .slice(0, limit)
          .map((service: any, index: number) => {
            const verifiedBadge = service.verified ? " ✅" : "";

            return `${index + 1}. **${service.name}**${verifiedBadge}
📝 ${service.tagline || "Professional AI service"}
⭐ ${service.likes || 0} likes • 📦 ${service.orders || 0} orders
🏷️ Type: ${service.type}
🔗 https://initiate.platform/services/${service.id}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `🎯 **AI Solutions for:** "${businessProblem}"
${industry ? `📍 **Industry:** ${industry}` : ""}
${budget ? `💰 **Budget:** ${budget}` : ""}

Here are ${Math.min(services.length, limit)} recommendations:

${resultsText}

💬 **Next Steps:** Contact these providers directly or ask me for more details about any specific service!`,
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error finding services: ${message}`,
            },
          ],
        };
      }
    },
  );

  server.server.onerror = console.error.bind(console);
  return server;
};

const mcp = new Hono();

mcp.onError((error, c) => {
  const { sentry } = c.var;
  console.error(error);
  sentry.captureException(error);
  return c.json(
    {
      id: null,
      jsonrpc: "2.0",
      message: error.message,
      error: {
        code: -32603,
        message: error.message,
      },
    },
    {
      status: 500,
    },
  );
});

mcp.post("/", async (c) => {
  const { req, res } = toReqRes(c.req.raw);

  const server = getServer(c as unknown as AppContext);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  transport.onerror = console.error.bind(console);

  await server.connect(transport);
  await transport.handleRequest(req, res, await c.req.json());

  res.on("close", () => {
    transport.close();
    server.close();
  });

  return toFetchResponse(res);
});

mcp.get("/", async (c) => {
  return c.json(
    {
      id: null,
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
    },
    {
      status: 405,
    },
  );
});

mcp.delete("/", async (c) => {
  return c.json(
    {
      id: null,
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
    },
    {
      status: 405,
    },
  );
});

export default mcp;
