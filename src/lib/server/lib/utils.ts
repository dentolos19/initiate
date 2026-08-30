import type { Context } from "hono";

import {
  communityPostCountExtras,
  organizationCountExtras,
  serviceCountExtras,
  userCountExtras,
} from "#/lib/database/query-fragments.js";
import { communityPost } from "#/lib/database/schema.js";
import { stripe } from "#/lib/server/integrations.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database, insertEmbedding, searchEmbeddings } from "#/lib/server/integrations/database.js";
import { generateEmbedding, indexEmbeddings } from "#/lib/server/lib/embeddings.js";

export function slugify(text: string) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "_");
}

export function safeParseInt(value: any, fallback: number = 1) {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

export function forceSerializable<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function getOriginUrl(context: Context) {
  const origin = new URL(context.req.url).origin;
  return origin;
}

export async function getUser(context: Context) {
  const auth = getAuth(context);
  if (!auth || !auth.userId) return null;
  return await database.query.user.findFirst({
    where: {
      id: auth.userId,
    },
  });
}

export async function getOrganization(context: Context) {
  const orgId = getOrganizationId(context);
  if (!orgId) return null;
  return await database.query.organization.findFirst({
    where: {
      id: orgId,
    },
  });
}

export function getOrganizationId(context: Context) {
  return context.req.header("X-Organization-Id") ?? getAuth(context).orgId;
}

export async function getCustomer(userId: string, accountId: string) {
  const customers = await stripe.customers.search(
    {
      query: `metadata['id']:'${userId}'`,
      limit: 1,
    },
    {
      stripeAccount: accountId,
    },
  );

  const user = await database.query.user.findFirst({ where: { id: userId } });
  if (!user?.email) throw new Error("The user does not have a billing email address.");
  const userName = `${user.firstName} ${user.lastName ?? ""}`.trim();
  const userEmail = user.email;

  if (customers.data.length === 0) {
    return await stripe.customers.create(
      {
        name: userName,
        email: userEmail,
        metadata: {
          id: userId,
        },
      },
      {
        stripeAccount: accountId,
      },
    );
  } else {
    let customer = customers.data[0];

    if (customer.name !== userName || customer.email !== userEmail) {
      customer = await stripe.customers.update(
        customer.id,
        {
          name: userName,
          email: userEmail,
        },
        {
          stripeAccount: accountId,
        },
      );
    }

    return customer;
  }
}

export async function checkMembership(userId: string, organizationId: string) {
  const membership = await database.query.authMember.findFirst({ where: { userId, organizationId } });
  return Boolean(membership);
}

export async function searchServices(context: Context, query: string, page: number = 1, limit: number = 10) {
  const auth = getAuth(context);
  try {
    const embedding = await generateEmbedding(query);
    const similarities = await searchEmbeddings("service", embedding.vector, page, limit);
    const services = await database.query.service.findMany({
      where: { id: { in: similarities.map((item) => item.id) }, status: "published" },
      extras: serviceCountExtras,
      with: {
        organization: { columns: { verified: true } },
        likes: auth?.userId ? { where: { userId: auth.userId } } : false,
        plans: { where: { default: true }, limit: 1 },
      },
    });

    return similarities
      .map((item) => {
        const service = services.find((service) => service.id === item.id);
        if (!service) return null;

        return {
          ...service,
          verified: service.organization?.verified ?? false,
          plan: service.plans[0] ?? null,
          orders: service.ordersCount,
          likes: service.likesCount,
          isLiked: (service.likes?.length ?? 0) > 0,
          similarity: item.similarity,
        };
      })
      .filter((item) => !!item);
  } catch (error) {
    console.warn("Semantic service search is unavailable; using text search.", error);
    const services = await database.query.service.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      where: {
        status: "published",
        OR: [
          { name: { ilike: `%${query}%` } },
          { description: { ilike: `%${query}%` } },
          { tagline: { ilike: `%${query}%` } },
        ],
      },
      extras: serviceCountExtras,
      with: {
        organization: {
          columns: {
            verified: true,
          },
        },
        likes: auth?.userId ? { where: { userId: auth.userId } } : false,
        plans: {
          where: {
            default: true,
          },
          limit: 1,
        },
      },
    });

    return services.map((service) => ({
      ...service,
      verified: service.organization?.verified ?? false,
      plan: service.plans[0] ?? null,
      orders: service.ordersCount,
      likes: service.likesCount,
      isLiked: (service.likes?.length ?? 0) > 0,
      similarity: 0,
    }));
  }
}

export async function searchOrganizations(context: Context, query: string, page: number = 1, limit: number = 10) {
  try {
    // Simple text search
    const offset = (page - 1) * limit;

    const organizations = await database.query.organization.findMany({
      where: {
        OR: [{ name: { ilike: `%${query}%` } }, { description: { ilike: `%${query}%` } }],
      },
      limit: limit,
      offset,
      orderBy: { createdAt: "desc" },
      extras: organizationCountExtras,
    });

    // Add likes count to match expected format
    return organizations.map((org) => ({
      ...org,
      likes: org.likesCount,
      isLiked: false, // Default for unauthenticated users
    }));
  } catch (error) {
    console.error("Error in searchOrganizations:", error);
    return []; // Return empty array on error to prevent crashes
  }
}

export async function searchUsers(context: Context, query: string, page: number = 1, limit: number = 10) {
  const auth = getAuth(context);
  try {
    const embedding = await generateEmbedding(query);
    const similarities = await searchEmbeddings("user", embedding.vector, page, limit);
    const users = await database.query.user.findMany({
      where: { id: { in: similarities.map((item) => item.id) } },
      extras: userCountExtras,
      with: {
        followers: auth?.userId ? { where: { userId: auth.userId } } : false,
      },
    });

    return similarities
      .map((item) => {
        const user = users.find((user) => user.id === item.id);
        if (!user) return null;

        return {
          ...user,
          followers: user.followersCount,
          following: user.followingsCount,
          isFollowing: (user.followers?.length ?? 0) > 0,
          similarity: item.similarity,
        };
      })
      .filter((item) => item !== null);
  } catch (error) {
    console.warn("Semantic user search is unavailable; using text search.", error);
    const users = await database.query.user.findMany({
      offset: (page - 1) * limit,
      limit: limit,
      where: {
        OR: [
          { firstName: { ilike: `%${query}%` } },
          { lastName: { ilike: `%${query}%` } },
          { email: { ilike: `%${query}%` } },
          { description: { ilike: `%${query}%` } },
          { tagline: { ilike: `%${query}%` } },
        ],
      },
      extras: userCountExtras,
      with: {
        followers: auth?.userId ? { where: { userId: auth.userId } } : false,
      },
    });

    return users.map((user) => ({
      ...user,
      followers: user.followersCount,
      following: user.followingsCount,
      isFollowing: (user.followers?.length ?? 0) > 0,
      similarity: 0,
    }));
  }
}

export async function searchGrants(context: Context, query: string, page: number = 1, limit: number = 10) {
  // Simple text search over ResourceGrant name and description. Pagination via page/limit.
  const offset = (page - 1) * limit;

  const grants = await database.query.resourceGrant.findMany({
    where: {
      OR: [
        { name: { ilike: `%${query}%` } },
        { description: { ilike: `%${query}%` } },
        { provider: { ilike: `%${query}%` } },
      ],
    },
    orderBy: { createdAt: "desc" },
    limit: limit,
    offset,
  });

  return grants;
}

export async function searchGrantsWithEmbeddings(
  context: Context,
  query: string,
  page: number = 1,
  limit: number = 10,
) {
  const org = await getOrganization(context);
  if (!org) return [];

  // pass in org details for context
  const enhancedQuery = org
    ? [query, org.type, org.location, ...(org.tags ?? []), org.description].filter(Boolean).join(" ")
    : query;

  const embedding = await generateEmbedding(enhancedQuery);

  const similarities = await searchEmbeddings("resourceGrant", embedding.vector, page, limit);
  const grants = await database.query.resourceGrant.findMany({
    where: {
      id: { in: similarities.map((item) => item.id) },
      ...(org.location && {
        OR: [{ location: { ilike: `%${org.location}%` } }, { location: { isNull: true } }],
      }),
    },
    orderBy: { createdAt: "desc" },
  });

  return similarities
    .map((item) => {
      const grant = grants.find((grant) => grant.id === item.id);
      if (!grant) return null;

      return {
        ...grant,
        similarity: item.similarity,
      };
    })
    .filter((item) => item !== null);
}

export async function createCommunityPost(
  context: Context,
  data: {
    type: string;
    title: string;
    content: string;
    htmlContent?: string;
    tags?: string[];
    budget?: number;
    deadline?: string;
    confirmPost: boolean;
  },
) {
  const auth = getAuth(context);

  if (!auth?.userId) {
    return {
      success: false,
      message: "You must be logged in to create a post.",
      requiresAuth: true,
    };
  }

  const { type, title, content, htmlContent, tags, budget, deadline, confirmPost } = data;

  if (!confirmPost) {
    return {
      success: true,
      preview: true,
      postData: {
        type,
        title,
        content,
        tags: tags || [],
        budget,
        deadline,
      },
      message: "Post prepared. Please confirm if you want to publish this post to the community.",
    };
  }

  try {
    // Create the post in the database - use HTML content if provided, otherwise use plain content
    const [createdPost] = await database
      .insert(communityPost)
      .values({
        userId: auth.userId,
        title,
        content: htmlContent || content,
        type,
        tags: tags || [],
        budget,
        deadline: deadline ? new Date(deadline) : null,
      })
      .returning({ id: communityPost.id });
    const post = await database.query.communityPost.findFirst({
      where: { id: createdPost.id },
      extras: communityPostCountExtras,
      with: {
        user: true,
        organization: true,
      },
    });

    if (!post) throw new Error("Community post was not found after creation.");

    await indexEmbeddings(
      (vector) => insertEmbedding("communityPost", post.id, vector),
      post.title,
      post.content,
      (post.tags || []).join(", "),
    );

    return {
      success: true,
      message: "Post created successfully!",
      redirectUrl: `/community/${post.id}`,
      post: {
        ...post,
        comments: post.commentsCount,
        likes: post.likesCount,
        liked: false,
      },
    };
  } catch (error) {
    console.error("Error creating community post:", error);
    return {
      success: false,
      message: "Failed to create post. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
