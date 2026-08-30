import { defineRelations } from "drizzle-orm";

import * as schema from "#/lib/database/schema";

export const relations = defineRelations(schema, (relation) => ({
  authMember: {
    organization: relation.one.organization({
      from: relation.authMember.organizationId,
      to: relation.organization.id,
    }),
    user: relation.one.user({ from: relation.authMember.userId, to: relation.user.id }),
  },
  call: {
    initiator: relation.one.user({
      from: relation.call.initiatorId,
      to: relation.user.id,
      alias: "callInitiator",
    }),
    participants: relation.many.callParticipant(),
  },
  callParticipant: {
    call: relation.one.call({ from: relation.callParticipant.callId, to: relation.call.id }),
    user: relation.one.user({ from: relation.callParticipant.userId, to: relation.user.id }),
  },
  communityComment: {
    user: relation.one.user({ from: relation.communityComment.userId, to: relation.user.id }),
    post: relation.one.communityPost({
      from: relation.communityComment.postId,
      to: relation.communityPost.id,
    }),
    comment: relation.one.communityComment({
      from: relation.communityComment.parentId,
      to: relation.communityComment.id,
      alias: "commentThread",
    }),
    replies: relation.many.communityComment({ alias: "commentThread" }),
  },
  communityFollow: {
    user: relation.one.user({ from: relation.communityFollow.userId, to: relation.user.id }),
  },
  communityLike: {
    user: relation.one.user({ from: relation.communityLike.userId, to: relation.user.id }),
    post: relation.one.communityPost({ from: relation.communityLike.postId, to: relation.communityPost.id }),
  },
  communityPost: {
    user: relation.one.user({ from: relation.communityPost.userId, to: relation.user.id }),
    organization: relation.one.organization({
      from: relation.communityPost.organizationId,
      to: relation.organization.id,
    }),
    comments: relation.many.communityComment(),
    likes: relation.many.communityLike(),
    proposals: relation.many.communityProposal(),
  },
  communityProposal: {
    post: relation.one.communityPost({ from: relation.communityProposal.postId, to: relation.communityPost.id }),
    user: relation.one.user({ from: relation.communityProposal.userId, to: relation.user.id }),
    organization: relation.one.organization({
      from: relation.communityProposal.organizationId,
      to: relation.organization.id,
    }),
  },
  message: {
    user: relation.one.user({ from: relation.message.userId, to: relation.user.id }),
    room: relation.one.messageRoom({ from: relation.message.roomId, to: relation.messageRoom.id }),
  },
  messageRoom: {
    messages: relation.many.message(),
    users: relation.many.roomUserParticipant(),
    organizations: relation.many.roomOrganizationParticipant(),
  },
  notification: {
    user: relation.one.user({ from: relation.notification.userId, to: relation.user.id }),
  },
  order: {
    user: relation.one.user({ from: relation.order.userId, to: relation.user.id }),
    service: relation.one.service({ from: relation.order.serviceId, to: relation.service.id }),
    plan: relation.one.servicePlan({ from: relation.order.planId, to: relation.servicePlan.id }),
    organization: relation.one.organization({
      from: relation.order.organizationId,
      to: relation.organization.id,
    }),
    milestones: relation.many.orderMilestone(),
    invoices: relation.many.orderInvoice(),
    disputes: relation.many.orderDispute(),
  },
  orderDispute: {
    order: relation.one.order({ from: relation.orderDispute.orderId, to: relation.order.id }),
  },
  orderInvoice: {
    user: relation.one.user({ from: relation.orderInvoice.userId, to: relation.user.id }),
    order: relation.one.order({ from: relation.orderInvoice.orderId, to: relation.order.id }),
    milestone: relation.one.orderMilestone({
      from: relation.orderInvoice.milestoneId,
      to: relation.orderMilestone.id,
    }),
  },
  orderMilestone: {
    order: relation.one.order({ from: relation.orderMilestone.orderId, to: relation.order.id }),
    invoices: relation.many.orderInvoice(),
  },
  organization: {
    authMembers: relation.many.authMember(),
    services: relation.many.service(),
    likes: relation.many.organizationLike(),
    reviews: relation.many.organizationReview(),
    rooms: relation.many.roomOrganizationParticipant(),
    posts: relation.many.communityPost(),
    notifications: relation.many.organizationNotification(),
    proposals: relation.many.communityProposal(),
    orders: relation.many.order(),
  },
  organizationLike: {
    user: relation.one.user({ from: relation.organizationLike.userId, to: relation.user.id }),
    organization: relation.one.organization({
      from: relation.organizationLike.organizationId,
      to: relation.organization.id,
    }),
  },
  organizationNotification: {
    organization: relation.one.organization({
      from: relation.organizationNotification.organizationId,
      to: relation.organization.id,
    }),
  },
  organizationReview: {
    user: relation.one.user({ from: relation.organizationReview.userId, to: relation.user.id }),
    organization: relation.one.organization({
      from: relation.organizationReview.organizationId,
      to: relation.organization.id,
    }),
  },
  roomOrganizationParticipant: {
    organization: relation.one.organization({
      from: relation.roomOrganizationParticipant.organizationId,
      to: relation.organization.id,
    }),
    room: relation.one.messageRoom({
      from: relation.roomOrganizationParticipant.roomId,
      to: relation.messageRoom.id,
    }),
  },
  roomUserParticipant: {
    user: relation.one.user({ from: relation.roomUserParticipant.userId, to: relation.user.id }),
    room: relation.one.messageRoom({
      from: relation.roomUserParticipant.roomId,
      to: relation.messageRoom.id,
    }),
  },
  service: {
    organization: relation.one.organization({
      from: relation.service.organizationId,
      to: relation.organization.id,
    }),
    plans: relation.many.servicePlan(),
    likes: relation.many.serviceLike(),
    reviews: relation.many.serviceReview(),
    orders: relation.many.order(),
  },
  serviceLike: {
    user: relation.one.user({ from: relation.serviceLike.userId, to: relation.user.id }),
    service: relation.one.service({ from: relation.serviceLike.serviceId, to: relation.service.id }),
  },
  servicePlan: {
    service: relation.one.service({ from: relation.servicePlan.serviceId, to: relation.service.id }),
    orders: relation.many.order(),
  },
  serviceReview: {
    user: relation.one.user({ from: relation.serviceReview.userId, to: relation.user.id }),
    service: relation.one.service({ from: relation.serviceReview.serviceId, to: relation.service.id }),
  },
  user: {
    authMemberships: relation.many.authMember(),
    followings: relation.many.userFollow({ alias: "follower" }),
    followers: relation.many.userFollow({ alias: "following" }),
    rooms: relation.many.roomUserParticipant(),
    messages: relation.many.message(),
    chats: relation.many.userChat(),
    notifications: relation.many.notification(),
    communityPosts: relation.many.communityPost(),
    communityComments: relation.many.communityComment(),
    communityLikes: relation.many.communityLike(),
    communityProposals: relation.many.communityProposal(),
    followedTags: relation.many.communityFollow(),
    organizationReviews: relation.many.organizationReview(),
    organizationLikes: relation.many.organizationLike(),
    serviceReviews: relation.many.serviceReview(),
    serviceLikes: relation.many.serviceLike(),
    orders: relation.many.order(),
    orderInvoices: relation.many.orderInvoice(),
    initiatedCalls: relation.many.call({ alias: "callInitiator" }),
    callParticipations: relation.many.callParticipant(),
  },
  userChat: {
    user: relation.one.user({ from: relation.userChat.userId, to: relation.user.id }),
  },
  userFollow: {
    user: relation.one.user({
      from: relation.userFollow.userId,
      to: relation.user.id,
      alias: "follower",
    }),
    follow: relation.one.user({
      from: relation.userFollow.followId,
      to: relation.user.id,
      alias: "following",
    }),
  },
}));
