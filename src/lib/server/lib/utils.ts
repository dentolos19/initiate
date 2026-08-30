import type { Context } from "hono";

import {
  communityPostCountExtras,
  organizationCountExtras,
  serviceCountExtras,
  userCountExtras,
} from "#/lib/database/query-fragments.js";
import { communityPost } from "#/lib/database/schema.js";
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

export async function checkMembership(userId: string, organizationId: string) {
  const membership = await database.query.authMember.findFirst({ where: { userId, organizationId } });
  return Boolean(membership);
}

export async function searchServices(context: Context, query: string, page: number = 1, limit: number = 10) {
  const auth = getAuth(context);
  const offset = Math.max(0, page - 1) * limit;
  const candidateLimit = Math.min(offset + limit, 100);
  const normalizedQuery = query.trim().toLowerCase();

  const textServices = await database.query.service.findMany({
    limit: candidateLimit,
    where: {
      status: "published",
      OR: [
        { name: { like: `%${query}%` } },
        { description: { like: `%${query}%` } },
        { tagline: { like: `%${query}%` } },
      ],
    },
    extras: serviceCountExtras,
    with: {
      organization: { columns: { verified: true } },
      likes: auth?.userId ? { where: { userId: auth.userId } } : false,
      plans: { where: { default: true }, limit: 1 },
    },
  });

  const mapService = (service: (typeof textServices)[number], similarity = 1) => ({
    ...service,
    verified: service.organization?.verified ?? false,
    plan: service.plans[0] ?? null,
    orders: service.ordersCount,
    likes: service.likesCount,
    isLiked: (service.likes?.length ?? 0) > 0,
    similarity,
  });

  const textResults = textServices
    .toSorted((left, right) => {
      const leftExact = left.name.trim().toLowerCase() === normalizedQuery;
      const rightExact = right.name.trim().toLowerCase() === normalizedQuery;
      return Number(rightExact) - Number(leftExact);
    })
    .map((service) => mapService(service));

  try {
    const embedding = await generateEmbedding(query);
    const similarities = (await searchEmbeddings("service", embedding.vector, 1, 100)).filter(
      (item) => item.similarity >= 0.55,
    );
    const services = await database.query.service.findMany({
      where: { id: { in: similarities.map((item) => item.id) }, status: "published" },
      extras: serviceCountExtras,
      with: {
        organization: { columns: { verified: true } },
        likes: auth?.userId ? { where: { userId: auth.userId } } : false,
        plans: { where: { default: true }, limit: 1 },
      },
    });

    const textIds = new Set(textResults.map((service) => service.id));
    const semanticResults = similarities.flatMap((item) => {
      const service = services.find((service) => service.id === item.id);
      if (!service || textIds.has(service.id)) return [];
      return [mapService(service, item.similarity)];
    });

    return [...textResults, ...semanticResults].slice(offset, offset + limit);
  } catch (error) {
    console.warn("Semantic service search is unavailable; using text search.", error);
    return textResults.slice(offset, offset + limit);
  }
}

export async function searchOrganizations(context: Context, query: string, page: number = 1, limit: number = 10) {
  try {
    // Simple text search
    const offset = (page - 1) * limit;

    const organizations = await database.query.organization.findMany({
      where: {
        OR: [{ name: { like: `%${query}%` } }, { description: { like: `%${query}%` } }],
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
  const offset = Math.max(0, page - 1) * limit;
  const candidateLimit = Math.min(offset + limit, 100);
  const normalizedQuery = query.trim().toLowerCase();

  const textUsers = await database.query.user.findMany({
    limit: candidateLimit,
    where: {
      OR: [
        { firstName: { like: `%${query}%` } },
        { lastName: { like: `%${query}%` } },
        { email: { like: `%${query}%` } },
        { description: { like: `%${query}%` } },
        { tagline: { like: `%${query}%` } },
      ],
    },
    extras: userCountExtras,
    with: {
      followers: auth?.userId ? { where: { userId: auth.userId } } : false,
    },
  });

  const mapUser = (user: (typeof textUsers)[number], similarity = 1) => ({
    ...user,
    followers: user.followersCount,
    following: user.followingsCount,
    isFollowing: (user.followers?.length ?? 0) > 0,
    similarity,
  });

  const textResults = textUsers
    .toSorted((left, right) => {
      const leftName = `${left.firstName} ${left.lastName ?? ""}`.trim().toLowerCase();
      const rightName = `${right.firstName} ${right.lastName ?? ""}`.trim().toLowerCase();
      return Number(rightName === normalizedQuery) - Number(leftName === normalizedQuery);
    })
    .map((user) => mapUser(user));

  try {
    const embedding = await generateEmbedding(query);
    const similarities = (await searchEmbeddings("user", embedding.vector, 1, 100)).filter(
      (item) => item.similarity >= 0.55,
    );
    const users = await database.query.user.findMany({
      where: { id: { in: similarities.map((item) => item.id) } },
      extras: userCountExtras,
      with: {
        followers: auth?.userId ? { where: { userId: auth.userId } } : false,
      },
    });

    const textIds = new Set(textResults.map((user) => user.id));
    const semanticResults = similarities.flatMap((item) => {
      const user = users.find((user) => user.id === item.id);
      if (!user || textIds.has(user.id)) return [];
      return [mapUser(user, item.similarity)];
    });

    return [...textResults, ...semanticResults].slice(offset, offset + limit);
  } catch (error) {
    console.warn("Semantic user search is unavailable; using text search.", error);
    return textResults.slice(offset, offset + limit);
  }
}

export async function searchGrants(context: Context, query: string, page: number = 1, limit: number = 10) {
  // Simple text search over ResourceGrant name and description. Pagination via page/limit.
  const offset = (page - 1) * limit;

  const grants = await database.query.resourceGrant.findMany({
    where: {
      OR: [
        { name: { like: `%${query}%` } },
        { description: { like: `%${query}%` } },
        { provider: { like: `%${query}%` } },
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
        OR: [{ location: { like: `%${org.location}%` } }, { location: { isNull: true } }],
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
