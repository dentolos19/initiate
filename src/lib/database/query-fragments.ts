import { sql } from "drizzle-orm";

import {
  communityComment,
  communityLike,
  communityPost,
  order,
  organization,
  organizationLike,
  service,
  serviceLike,
  serviceReview,
  user,
  userFollow,
} from "#/lib/database/schema";

export const communityPostCountExtras = {
  commentsCount: (post: typeof communityPost) =>
    sql<number>`(select count(*) from ${communityComment} where ${communityComment.postId} = ${post.id})`.mapWith(
      Number,
    ),
  likesCount: (post: typeof communityPost) =>
    sql<number>`(select count(*) from ${communityLike} where ${communityLike.postId} = ${post.id})`.mapWith(Number),
};

export const organizationCountExtras = {
  likesCount: (row: typeof organization) =>
    sql<number>`(select count(*) from ${organizationLike} where ${organizationLike.organizationId} = ${row.id})`.mapWith(
      Number,
    ),
  ordersCount: (row: typeof organization) =>
    sql<number>`(select count(*) from ${order} where ${order.organizationId} = ${row.id})`.mapWith(Number),
};

export const serviceCountExtras = {
  likesCount: (row: typeof service) =>
    sql<number>`(select count(*) from ${serviceLike} where ${serviceLike.serviceId} = ${row.id})`.mapWith(Number),
  ordersCount: (row: typeof service) =>
    sql<number>`(select count(*) from ${order} where ${order.serviceId} = ${row.id})`.mapWith(Number),
  reviewsCount: (row: typeof service) =>
    sql<number>`(select count(*) from ${serviceReview} where ${serviceReview.serviceId} = ${row.id})`.mapWith(Number),
};

export const userCountExtras = {
  followersCount: (row: typeof user) =>
    sql<number>`(select count(*) from ${userFollow} where ${userFollow.followId} = ${row.id})`.mapWith(Number),
  followingsCount: (row: typeof user) =>
    sql<number>`(select count(*) from ${userFollow} where ${userFollow.userId} = ${row.id})`.mapWith(Number),
};
