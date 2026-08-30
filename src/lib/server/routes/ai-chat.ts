import { convertToCoreMessages, generateObject, streamText, tool } from "ai";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { z } from "zod";

import { userChat } from "#/lib/database/schema.js";
import { generationModel } from "#/lib/server/integrations/ai.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { createCommunityPost, getOrganization, searchGrants, searchServices } from "#/lib/server/lib/utils.js";

const aiChat = new Hono();

aiChat.post("/chat", async (c) => {
  const { messages } = await c.req.json();

  const result = streamText({
    model: generationModel,
    messages: convertToCoreMessages(messages),
    system: `
      You are an expert virtual assistant on a digital services platform that also provides access to grants and funding opportunities, and also helps users articulate their business problems.
      Your tone should always be friendly, concise, and professional—sounding knowledgeable without being overly formal.

      **Search Guidelines:**
      - Use searchServices to find relevant AI services and solutions
      - Use searchGrants to find funding opportunities
      - Use getMyOrders to show user's order history
      - Use getMyAnalytics to provide business insights
      - Use getNotifications to check user notifications
      - Use checkMessages to show recent messages
      - Use findServicesByNeed for intelligent service matching

      **Business Problem Articulation**:
      - When user asks for help articulating business problem, your job is to ask the user a series of questions, one at a time, to fill out the following sections:
        - Problem Statement
        - Business Objective
        - User Stories
        - Requirements Overview
        - Summary of Purpose
      - Only ask one question at a time. Wait for the user's answer before proceeding.
      - Do not explicitly mention which section you are seeking and answer for, make it seem like a natural conversation where you find out more about the issue they face.
      - If the user says "Skip", acknowledge and move to the next question.
      - If the user says "Skip All", stop asking and summarize all information gathered so far.
      - When all sections are answered or skipped, generate a detailed summary containing all relevant information for the above sections.

      **Community Post Creation**:
      - When the user wants to create a post, first ask what type of post they want to create:
        - General: Basic community post for general discussion
        - Problem Statement: Detailed problem articulation (use business problem format)
      - Collect relevant information based on the post type:
        - Title (always required)
        - Content (always required)
        - Tags (optional but recommended)
        - Budget (for problem statements)
        - Deadline (for problem statement posts)
      - For problem statement posts, also make sure to use the business problem articulation format in the content
      - Always use createCommunityPost with confirmPost=false first to show a preview
      - Then ask for confirmation before calling with confirmPost=true to actually post
      - When confirmPost=true, provide htmlContent parameter with the content formatted in clean HTML (paragraphs, headings, lists, etc.) for better display in the community

      **When to use searchServices**:
      - Only use the searchServices tool when the user is asking about services, products, or solutions available on the platform
      - Do NOT use searchServices for general questions, greetings, or non-service related inquiries
      - For specific product names or exact service mentions, use limit=1 to find the exact match
      - For general categories or exploration queries, use limit=5 to show options

      **When to use searchGrants**:
      - Use the searchGrants tool when the user is asking about grants, funding opportunities, financial support, or investment opportunities
      - Search for grants when users ask about funding for startups, businesses, research, education, or specific industries
      - For specific grant programs or funding bodies, use limit=1 to find exact matches
      - For general funding inquiries, use limit=5 to show various options

      **When to use createCommunityPost**:
      - Use this tool when the user explicitly wants to create, make, or post something to the community
      - This tool handles different types of posts: general, problem statement.
      - For problem statement posts, ensure you follow the business problem articulation format from the system instructions
      - Always ask for confirmation before actually posting to the community

      **Search Strategy**:
      - If the user mentions a specific product name, service name, or brand: search with that exact term and limit=1
      - If the user mentions a specific grant name or funding body: search grants with that exact term and limit=1
      - If the user asks about a category or type of service: search with the category keywords and limit=5
      - If the user asks about funding for a specific industry/purpose: search grants with relevant keywords and limit=5
      - If the user asks "what services do you have" or similar broad questions: search with general terms and limit=5
      - If the user asks "what grants are available" or similar: search grants with general terms and limit=5
      - Extract the most relevant keywords from the user's query for your search

      **Response Format**:
      When you find services via searchServices, format each result as:
      - A **bolded title** (the service name)
      - A concise, user-friendly description focusing on the service's purpose and practical benefits
      - Include relevant details like pricing, features, or capabilities when available

      When you find grants via searchGrants, format each result as:
      - A **bolded title** (the grant name and provider)
      - A clear description of the grant's purpose and who it's for
      - Include key details like grant amount, location, deadline, and application process when available

      When creating community posts via createCommunityPost:
      - First show a preview of the post before asking for confirmation
      - Clearly indicate what type of post will be created
      - For problem statement posts, ensure the content follows the structured format with clear sections
      - After successful creation, if the response includes a redirectUrl, tell the user "Your post has been created successfully! Click here to view it: [View Post](redirectUrl)" where redirectUrl is the actual URL returned
      - Make the redirect URL clickable by formatting it as a markdown link

      **When no services or grants are found**:
      Politely explain that no matching results were found and suggest:
      - Rephrasing the query with different keywords
      - Trying related or broader search terms
      - Asking about general categories instead of specific names

      **General Guidelines**:
      - Never hallucinate or make up services, grants, or post content—only use what the tools return or what users provide
      - Be proactive: anticipate follow-up questions and offer helpful suggestions
      - For non-service, non-grant, and non-post creation questions, respond naturally without using tools
      - Keep responses concise but informative
      - When appropriate, suggest both services and grants that might be relevant to the user's needs
      - For post creation, always guide users through the process step by step
      - Ensure problem statement posts are well-structured and comprehensive
      - Always ask for confirmation before posting to the community
    `,
    tools: {
      searchServices: tool({
        description: "Search for services on our platform.",
        parameters: z.object({
          query: z.string(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(5),
        }),
        execute: async ({ query, page, limit }) => {
          try {
            const results = await searchServices(c, query, page, limit);
            return results || [];
          } catch (error) {
            console.error("Error in searchServices tool:", error);
            return {
              error: "Failed to search services",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
      searchGrants: tool({
        description: "Search for grants and funding opportunities on our platform.",
        parameters: z.object({
          query: z.string(),
          page: z.number().optional().default(1),
          limit: z.number().optional().default(5),
        }),
        execute: async ({ query, page, limit }) => {
          try {
            const results = await searchGrants(c, query, page, limit);
            return results || [];
          } catch (error) {
            console.error("Error in searchGrants tool:", error);
            return {
              error: "Failed to search grants",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
      createCommunityPost: tool({
        description: "Create or preview a community post.",
        parameters: z.object({
          type: z.string(),
          title: z.string(),
          content: z.string(),
          htmlContent: z.string().optional(),
          tags: z.array(z.string()).optional().default([]),
          budget: z.number().positive().optional(),
          deadline: z.string().datetime().optional(),
          confirmPost: z.boolean(),
        }),
        execute: async (args) => {
          try {
            const result = await createCommunityPost(c, args);
            return result || { error: "Failed to create community post" };
          } catch (error) {
            console.error("Error in createCommunityPost tool:", error);
            return {
              error: "Failed to create community post",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
      getMyAnalytics: tool({
        description: "Get organization analytics for a period (revenue and order stats).",
        parameters: z.object({ period: z.enum(["week", "month", "quarter"]).optional().default("month") }),
        execute: async ({ period = "month" }) => {
          try {
            const auth = getAuth(c);
            const organization = await getOrganization(c);
            if (!auth?.userId || !organization)
              return { error: "User must be logged in with an organization to view analytics" };

            const now = new Date();
            const daysBack = period === "week" ? 7 : period === "month" ? 30 : 90;
            const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

            const [orders, paidInvoices] = await Promise.all([
              database.query.order.findMany({
                where: { service: { organizationId: organization.id }, createdAt: { gte: startDate } },
              }),
              database.query.orderInvoice.findMany({
                where: {
                  order: { service: { organizationId: organization.id } },
                  status: "paid",
                  paidAt: { gte: startDate },
                },
              }),
            ]);

            const totalRevenueCents = paidInvoices.reduce(
              (sum: number, invoice: any) => sum + (invoice.amount || 0),
              0,
            );
            const totalOrders = orders.length;
            const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
            const confirmedOrders = orders.filter((o: any) => o.status === "confirmed").length;
            const completedOrders = orders.filter((o: any) => o.status === "completed").length;

            return {
              organizationName: organization.name,
              period,
              totalRevenue: totalRevenueCents / 100,
              totalOrders,
              avgOrderValue: totalOrders > 0 ? totalRevenueCents / totalOrders / 100 : 0,
              pendingOrders,
              confirmedOrders,
              completedOrders,
            };
          } catch (error) {
            console.error("Error in getMyAnalytics tool:", error);
            return {
              error: "Failed to get analytics",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
      getNotifications: tool({
        description: "Get the user's notifications from the platform.",
        parameters: z.object({
          filter: z.enum(["inbox", "archived", "all"]).optional().default("inbox"),
          limit: z.number().optional().default(5),
        }),
        execute: async ({ filter = "inbox", limit = 5 }) => {
          try {
            const auth = getAuth(c);
            if (!auth?.userId) return { error: "User must be logged in to view notifications" };

            const whereClause: any = { userId: auth.userId };
            if (filter === "inbox") whereClause.isArchived = false;
            else if (filter === "archived") whereClause.isArchived = true;

            const notifications = await database.query.notification.findMany({
              where: whereClause,
              limit: limit,
              orderBy: { createdAt: "desc" },
            });
            return notifications.map((n) => ({
              id: n.id,
              title: n.title,
              description: n.description,
              isRead: n.isRead,
              isArchived: n.isArchived,
              createdAt: n.createdAt,
            }));
          } catch (error) {
            console.error("Error in getNotifications tool:", error);
            return {
              error: "Failed to get notifications",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
      checkMessages: tool({
        description: "Check recent messages and conversations.",
        parameters: z.object({
          unreadOnly: z.boolean().optional().default(true),
          limit: z.number().optional().default(5),
        }),
        execute: async ({ unreadOnly = true, limit = 5 }) => {
          try {
            const auth = getAuth(c);
            if (!auth?.userId) return { error: "User must be logged in to check messages" };

            const whereClause: any = { OR: [{ userId: auth.userId }] };
            if (unreadOnly) {
              whereClause.isRead = false;
              whereClause.userId = auth.userId;
            }

            const messages = await database.query.message.findMany({
              where: whereClause,
              limit: limit,
              orderBy: { createdAt: "desc" },
              with: { user: { columns: { firstName: true, lastName: true } } },
            });
            return messages.map((m: any) => ({
              id: m.id,
              content: m.content.substring(0, 100) + (m.content.length > 100 ? "..." : ""),
              senderName: m.user ? `${m.user.firstName} ${m.user.lastName ?? ""}`.trim() : undefined,
              isFromMe: m.userId === auth.userId,
              createdAt: m.createdAt,
              isRead: m.isRead,
            }));
          } catch (error) {
            console.error("Error in checkMessages tool:", error);
            return {
              error: "Failed to check messages",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
      getMyOrders: tool({
        description: "Get the user's orders with optional status filtering.",
        parameters: z.object({
          status: z.enum(["pending", "confirmed", "completed", "all"]).optional().default("all"),
          limit: z.number().optional().default(5),
        }),
        execute: async ({ status, limit = 5 }) => {
          try {
            const auth = getAuth(c);
            if (!auth?.userId) return { error: "User must be logged in to view orders" };

            const whereClause: any = { userId: auth.userId };
            if (status !== "all") whereClause.status = status;

            const orders = await database.query.order.findMany({
              where: whereClause,
              limit: limit,
              orderBy: { createdAt: "desc" },
              with: {
                service: { columns: { name: true, type: true } },
                organization: { columns: { name: true, verified: true } },
              },
            });
            return orders.map((o) => ({
              id: o.id,
              serviceName: o.service?.name,
              organizationName: o.organization?.name,
              status: o.status,
              createdAt: o.createdAt,
              verified: o.organization?.verified,
            }));
          } catch (error) {
            console.error("Error in getMyOrders tool:", error);
            return { error: "Failed to get orders", details: error instanceof Error ? error.message : "Unknown error" };
          }
        },
      }),
      findServicesByNeed: tool({
        description: "Find AI services that match specific business problems or needs using intelligent matching.",
        parameters: z.object({
          businessProblem: z.string(),
          budget: z.string().optional(),
          industry: z.string().optional(),
          limit: z.number().optional().default(3),
        }),
        execute: async ({ businessProblem, budget, industry, limit = 3 }) => {
          try {
            const searchQuery = [businessProblem, industry && `for ${industry}`, budget && `budget ${budget}`]
              .filter(Boolean)
              .join(" ");

            let services = await searchServices(c, searchQuery, 1, limit * 2);
            if (!services || services.length === 0) {
              const broadSearch = businessProblem.split(" ").slice(0, 3).join(" ");
              services = await searchServices(c, broadSearch, 1, limit);
            }

            if (!services || services.length === 0) {
              return {
                error: `No services found for "${businessProblem}"`,
                suggestion: "Try describing your need differently or search for broader categories",
              };
            }

            const scoredServices = services
              .map((service) => {
                let score = (service.likes || 0) + (service.orders || 0) * 2;
                if (service.verified) score += 10;
                const serviceText = [service.name, service.tagline, service.description].join(" ").toLowerCase();
                const problemWords = businessProblem.toLowerCase().split(" ");
                const matches = problemWords.filter((word) => serviceText.includes(word)).length;
                score += matches * 5;
                return { ...service, relevanceScore: score } as typeof service & { relevanceScore: number };
              })
              .sort((a, b) => b.relevanceScore - a.relevanceScore)
              .slice(0, limit);

            return {
              businessProblem,
              industry,
              budget,
              recommendations: scoredServices.map((s) => ({
                id: s.id,
                name: s.name,
                tagline: s.tagline,
                type: s.type,
                likes: s.likes,
                orders: s.orders,
                verified: s.verified,
                relevanceScore: (s as any).relevanceScore,
              })),
            };
          } catch (error) {
            console.error("Error in findServicesByNeed tool:", error);
            return {
              error: "Failed to find services",
              suggestion: "Please try again with a different description",
              details: error instanceof Error ? error.message : "Unknown error",
            };
          }
        },
      }),
    },
    onError: ({ error }) => {
      console.error(error);
    },
  });

  c.header("X-Vercel-AI-Data-Stream", "v1");
  c.header("Content-Type", "text/plain; charset=utf-8");
  return stream(c, (s) => s.pipe(result.toDataStream()));
});

// generate problem statement summary from chat conversation
aiChat.post("/chat/generate-summary", async (c) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ message: "Please login." }, 401);

  const { messages } = await c.req.json();

  const result = await generateObject({
    model: generationModel,
    messages: convertToCoreMessages(messages),
    system: `
    Generate a comprehensive problem statement summary in clean HTML with headings and lists when appropriate.
    The document should be structured with the following sections if the information is available:
      1. **Problem Statement** - A clear, concise description of the core problem
      2. **Business Objective** - The goals and desired outcomes  
      3. **User Stories** - Specific scenarios from the user's perspective
      4. **Requirements Overview** - Key functional and non-functional requirements
      5. **Summary of Purpose** - Overall purpose and expected impact
      
      Guidelines:
      - Use professional, clear language
      - Structure content with proper HTML headings (h2, h3), paragraphs and bullet points.
      - Extract relevant information from the conversation even if some sections weren't fully addressed
      - If information is missing for a section, provide a brief note and placeholder content
      - Focus on actionable, specific details rather than generic statements
      - Make the content comprehensive enough to serve as a proper problem statement document
      
      Format the response as clean HTML that can be directly inserted into a rich text editor.
    `,
    schema: z.object({ summary: z.string().describe("The generated problem statement summary in HTML format") }),
  });

  return c.json(result.object);
});

// Generate follow-up suggestions
aiChat.post("/chat/suggest", async (c) => {
  const { messages } = await c.req.json();

  const result = await generateObject({
    model: generationModel,
    messages: convertToCoreMessages(messages),
    system: `
    Return up to 6 short, business-relevant follow-up suggestions for the user on Initiate.
    If the current context is about articulating a business problem, include 'Skip this question' and 'Skip all questions and generate draft' options to allow the user to bypass questions.
    `,
    schema: z.object({ suggestions: z.array(z.string()).max(6) }),
  });

  return c.json(result.object);
});

// Get chat histories
aiChat.get("/chat", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const chats = await database.query.userChat.findMany({
    where: {
      userId: auth.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    columns: {
      id: true,
      name: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  return c.json(chats);
});

// Get chat history
aiChat.get("/chat/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: "Please login." }, 401);
  }

  const id = c.req.param("id");

  const chat = await database.query.userChat.findFirst({
    where: {
      id: id,
      userId: auth.userId,
    },
  });

  if (!chat) {
    return c.json({ message: "Chat not found." }, 404);
  }

  if (chat.userId !== auth.userId) {
    return c.json({ message: "You do not own this chat history." }, 401);
  }

  return c.json(chat);
});

// Delete chat history
aiChat.delete("/chat/:id", async (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ message: "Please login." }, 401);
  }

  const id = c.req.param("id");

  const chat = await database.query.userChat.findFirst({
    where: {
      id: id,
      userId: auth.userId,
    },
  });

  if (!chat) {
    return c.json({ message: "Chat not found." }, 404);
  }

  if (chat.userId !== auth.userId) {
    return c.json({ message: "You do not own this chat history." }, 401);
  }

  await database.delete(userChat).where(eq(userChat.id, id));

  return c.json({ message: "Chat history deleted successfully." });
});

export default aiChat;
