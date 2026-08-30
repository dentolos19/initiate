import { z } from "zod";

import { BACKEND_URL } from "#/environment";
import { BackendPrimitives } from "#/lib/backend/primitives";
import { organizationSchema, userSchema } from "#/lib/backend/schema";

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  fileType: z.string().optional(),
  size: z.number().optional(),
});

export const messageSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    roomId: z.string(),
    content: z.string().nullish(),
    attachments: z.array(attachmentSchema).optional().default([]),
    updatedAt: z.string().datetime(),
    createdAt: z.string().datetime(),
  })
  .transform((data) => ({
    ...data,
    attachments: data.attachments || [],
  }));

export type Attachment = z.infer<typeof attachmentSchema>;

export const messageRoomSchema = z.object({
  id: z.string(),

  // Relationships
  messages: z.array(messageSchema).nullish(),
  users: z.array(z.object({ user: userSchema })).nullish(),
  organizations: z.array(z.object({ organization: organizationSchema })).nullish(),
});

export const userParticipant = z.object({
  userId: z.string(),

  // Relationships
  room: messageRoomSchema,
});

export const organizationParticipant = z.object({
  organizationId: z.string(),

  // Relationships
  room: messageRoomSchema,
});

export type Message = z.infer<typeof messageSchema>;
export type MessageRoom = z.infer<typeof messageRoomSchema>;
export type UserParticipant = z.infer<typeof userParticipant>;
export type OrganizationParticipant = z.infer<typeof organizationParticipant>;

export default function mapConnectors(primitives: BackendPrimitives) {
  return {
    // Create a room between a user and an organization
    createRoom: async (userId: string, organizationId: string): Promise<MessageRoom> => {
      const response = await primitives.post("/messages/rooms", { userId, organizationId });
      return messageRoomSchema.parse(response);
    },

    // Create a room between the current user and another user
    createUserRoom: async (userId: string): Promise<MessageRoom> => {
      const response = await primitives.post("/messages/rooms", { userId });
      return messageRoomSchema.parse(response);
    },

    // Create a room between the current user and an organization
    createOrganizationRoom: async (organizationId: string): Promise<MessageRoom> => {
      const response = await primitives.post("/messages/rooms", { organizationId });
      return messageRoomSchema.parse(response);
    },

    // Get rooms for the current user
    getUserRooms: async (): Promise<MessageRoom[]> => {
      const response = await primitives.get("/messages/rooms");
      return messageRoomSchema.array().parse(response);
    },

    // Get rooms for the current organization
    getOrganizationRooms: async (): Promise<MessageRoom[]> => {
      const response = await primitives.get(`/messages/rooms?context=organization`);
      return messageRoomSchema.array().parse(response);
    },

    // Get room participations for the current user
    getUserParticipations: async (): Promise<UserParticipant[]> => {
      const response = await primitives.get("/messages/participations?context=user");
      return userParticipant.array().parse(response);
    },

    // Get organization participations for the current organization
    getOrganizationParticipations: async (): Promise<OrganizationParticipant[]> => {
      const response = await primitives.get("/messages/participations?context=organization");
      return organizationParticipant.array().parse(response);
    },

    getRoom: async (roomId: string): Promise<MessageRoom> => {
      const response = await primitives.get(`/messages/rooms/${roomId}`);
      return messageRoomSchema.parse(response);
    },

    connectRoom: (roomId: string): WebSocket => {
      const domain = BACKEND_URL.replace(/^https?:\/\//, "");
      const protocol = domain.includes("localhost") ? "ws" : "wss";
      return new WebSocket(`${protocol}://${domain}/messages/rooms/${roomId}/connect`);
    },

    // Messages

    // createMessage: async (roomId: string, data: any) => {
    //   const response = await primitives.post(`/messages/${roomId}`, data);
    //   return messageSchema.parse(response);
    // },

    // getMessages: async (roomId: string) => {
    //   const response = await primitives.get(`/messages/${roomId}`);
    //   return messageSchema.array().parse(response);
    // },

    updateMessage: async (messageId: string, data: any) => {
      const response = await primitives.put(`/messages/${messageId}`, data);
      return messageSchema.parse(response);
    },

    deleteMessage: async (messageId: string) => {
      await primitives.delete(`/messages/${messageId}`);
    },

    // AI chat summary
    getSummary: async (roomId: string): Promise<{ summary: string }> => {
      const response = await primitives.post(`/messages/rooms/${roomId}/summary`);
      return z.object({ summary: z.string() }).parse(response);
    },
  };
}
