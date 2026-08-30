import { z } from "zod";

import { BackendPrimitives } from "#/lib/backend/primitives";

export const realtimeKitRoomSchema = z.object({
  meetingId: z.string(),
  authToken: z.string(),
  room: z.object({
    name: z.string(),
    enableVideo: z.boolean(),
  }),
});

export const realtimeKitCallHistorySchema = z.object({
  calls: z.array(
    z.object({
      id: z.string(),
      roomId: z.string(),
      messageRoomId: z.string().nullable(),
      initiatorId: z.string(),
      type: z.enum(["MISSED", "ACCEPTED"]),
      callType: z.enum(["VOICE", "VIDEO"]),
      startedAt: z.string(),
      endedAt: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
      initiator: z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string().nullable(),
        imageUrl: z.string().nullable(),
      }),
      participants: z.array(
        z.object({
          id: z.string(),
          callId: z.string(),
          userId: z.string(),
          joinedAt: z.string(),
          leftAt: z.string().nullable(),
          user: z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            imageUrl: z.string().nullable(),
          }),
        }),
      ),
    }),
  ),
});

export type RealtimeKitRoom = z.infer<typeof realtimeKitRoomSchema>;
export type RealtimeKitCallHistory = z.infer<typeof realtimeKitCallHistorySchema>;

export default function mapConnectors(primitives: BackendPrimitives) {
  const createRoom = (messageRoomId: string, enableVideo = false, maxParticipants = 10) =>
    primitives
      .post("/realtimekit/rooms", { messageRoomId, enableVideo, maxParticipants })
      .then((response) => realtimeKitRoomSchema.parse(response));

  return {
    createRoom,
    leaveRoom: (meetingId: string) =>
      primitives
        .post(`/realtimekit/rooms/${meetingId}/leave`)
        .then((response) => z.object({ success: z.boolean(), message: z.string() }).parse(response)),
    getCallHistory: () =>
      primitives.get("/realtimekit/calls/history").then((response) => realtimeKitCallHistorySchema.parse(response)),
    startVoiceCall: (messageRoomId: string, maxParticipants = 10) => createRoom(messageRoomId, false, maxParticipants),
    startVideoCall: (messageRoomId: string, maxParticipants = 10) => createRoom(messageRoomId, true, maxParticipants),
  };
}
