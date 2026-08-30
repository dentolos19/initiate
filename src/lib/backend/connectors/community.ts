import { z } from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";
import { organizationSchema, userSchema } from "#/lib/backend/schema";

const tagsSchema = z
  .string()
  .array()
  .nullish()
  .transform((value) => value ?? []);

export const communityPostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  organizationId: z.string().nullish(),
  imageUrl: z.string().nullish(),
  bannerUrl: z.string().nullish(),
  title: z.string(),
  excerpt: z.string().nullish(),
  content: z.string(),
  tags: tagsSchema,
  type: z.string().default("general"),
  budget: z.number().nullish(),
  deadline: z.string().datetime().nullish(),
  comments: z.number().default(0),
  likes: z.number().default(0),
  liked: z.boolean().default(false),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),

  // Relationships
  user: userSchema,
  organization: organizationSchema.nullish(),
});

export const communityCommentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  postId: z.string(),
  commentId: z.string().nullish(),
  content: z.string(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),

  // Relationships
  user: userSchema,
  replies: z.lazy((): z.ZodArray<z.ZodType<any>> => communityCommentSchema.array()).nullish(),
  replyingTo: userSchema.nullish(),
});

export const communityProposalSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  organizationId: z.string(),
  status: z.string().default("proposal"),
  title: z.string(),
  content: z.string(),
  duration: z.number().nullish(),
  cost: z.number().nullish(),
  updatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),

  // Relationships
  user: userSchema,
  organization: organizationSchema,
});

export type CommunityPost = z.infer<typeof communityPostSchema>;
export type CommunityComment = z.infer<typeof communityCommentSchema>;
export type CommunityProposal = z.infer<typeof communityProposalSchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    latestPosts: async (page: number = 1, limit: number = 10): Promise<CommunityPost[]> => {
      const response = await primitives.get(
        `/community/latest?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityPostSchema.array().parse(response);
    },

    problemPosts: async (page: number = 1, limit: number = 10): Promise<CommunityPost[]> => {
      const response = await primitives.get(
        `/community/problems?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityPostSchema.array().parse(response);
    },

    popularPosts: async (page: number = 1, limit: number = 10): Promise<CommunityPost[]> => {
      const response = await primitives.get(
        `/community/popular?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityPostSchema.array().parse(response);
    },

    followedPosts: async (page: number = 1, limit: number = 10): Promise<CommunityPost[]> => {
      const response = await primitives.get(
        `/community/feed/following?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityPostSchema.array().parse(response);
    },

    createPost: async (data: any): Promise<CommunityPost> => {
      const response = await primitives.post("/community", data);
      return communityPostSchema.parse(response);
    },

    getPost: async (id: string): Promise<CommunityPost> => {
      const response = await primitives.get(`/community/${id}`);
      return communityPostSchema.parse(response);
    },

    updatePost: async (id: string, data: any): Promise<CommunityPost> => {
      const response = await primitives.put(`/community/${id}`, data);
      return communityPostSchema.parse(response);
    },

    deletePost: async (id: string): Promise<void> => {
      await primitives.delete(`/community/${id}`);
    },

    likePost: async (id: string): Promise<void> => {
      await primitives.post(`/community/${id}/like`);
    },

    unlikePost: async (id: string): Promise<void> => {
      await primitives.post(`/community/${id}/unlike`);
    },

    // Comments

    getCommentThread: async (
      postId: string,
    ): Promise<{
      comments: CommunityComment[];
      totalCount: number;
    }> => {
      const response = await primitives.get(`/community/${postId}/comments/thread`);
      return z
        .object({
          comments: z.array(communityCommentSchema),
          totalCount: z.number(),
        })
        .parse(response);
    },

    postComment: async (postId: string, content: string): Promise<CommunityComment> => {
      const response = await primitives.post(`/community/${postId}/comments`, {
        content,
      });
      return communityCommentSchema.parse(response);
    },

    updateComment: async (commentId: string, content: string): Promise<CommunityComment> => {
      const response = await primitives.put(`/community/comments/${commentId}`, {
        content,
      });
      return communityCommentSchema.parse(response);
    },

    replyToComment: async (postId: string, commentId: string, content: string): Promise<CommunityComment> => {
      const response = await primitives.post(`/community/${postId}/comments/${commentId}/reply`, {
        content,
      });
      return communityCommentSchema.parse(response);
    },

    deleteComment: async (commentId: string): Promise<{ message: string }> => {
      const response = await primitives.delete(`/community/_/comments/${commentId}`);
      return response;
    },

    // Topics

    getTopTopics: async (): Promise<string[]> => {
      const response = await primitives.get("/community/topics");
      return z.string().array().parse(response);
    },

    getFollowedTopics: async (): Promise<string[]> => {
      const response = await primitives.get("/community/me/following");
      return z.string().array().parse(response);
    },

    getPostsByTopic: async (topic: string, page: number = 1, limit: number = 10): Promise<CommunityPost[]> => {
      const response = await primitives.get(
        `/community/topic/${topic}?${new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        })}`,
      );
      return communityPostSchema.array().parse(response);
    },

    followTopic: async (tag: string): Promise<void> => {
      await primitives.post(`/community/topic/${tag}/follow`);
    },

    unfollowTopic: async (tag: string): Promise<void> => {
      await primitives.post(`/community/topic/${tag}/unfollow`);
    },

    isFollowingTopic: async (tag: string): Promise<boolean> => {
      const response = await primitives.get(`/community/topic/${tag}/following-status`);
      return z.object({ following: z.boolean() }).parse(response).following;
    },

    // Proposals

    getProposals: async (postId: string): Promise<CommunityProposal[]> => {
      const response = await primitives.get(`/community/${postId}/proposals`);
      return communityProposalSchema.array().parse(response);
    },

    createProposal: async (postId: string, data: any): Promise<CommunityProposal> => {
      const response = await primitives.post(`/community/${postId}/proposals`, data);
      return communityProposalSchema.parse(response);
    },

    updateProposal: async (proposalId: string, data: any): Promise<CommunityProposal> => {
      const response = await primitives.put(`/community/proposals/${proposalId}`, data);
      return communityProposalSchema.parse(response);
    },

    deleteProposal: async (proposalId: string): Promise<{ message: string }> => {
      const response = await primitives.delete(`/community/proposals/${proposalId}`);
      return z.object({ message: z.string() }).parse(response);
    },

    acceptProposal: async (proposalId: string): Promise<CommunityProposal> => {
      const response = await primitives.patch(`/community/proposals/${proposalId}/status`, { status: "accepted" });
      return communityProposalSchema.parse(response);
    },

    rejectProposal: async (proposalId: string): Promise<CommunityProposal> => {
      const response = await primitives.patch(`/community/proposals/${proposalId}/status`, { status: "rejected" });
      return communityProposalSchema.parse(response);
    },
  };
}
