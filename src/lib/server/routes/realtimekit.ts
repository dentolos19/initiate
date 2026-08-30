import { and, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { call as callTable, callParticipant } from "#/lib/database/schema.js";
import { REALTIMEKIT_PRESET_NAME } from "#/lib/server/environment.js";
import { getAuth } from "#/lib/server/integrations/auth.js";
import { database } from "#/lib/server/integrations/database.js";
import { realtimeKitRequest } from "#/lib/server/integrations/realtimekit.js";

const realtimekit = new Hono();

type Meeting = { id: string; title?: string; created_at?: string };
type Participant = {
  id: string;
  token?: string;
  custom_participant_id: string;
  name?: string;
};

const createRoomSchema = z.object({
  messageRoomId: z.string(),
  enableVideo: z.boolean().default(false),
  maxParticipants: z.number().optional().default(10),
});

async function getDisplayName(userId: string) {
  const user = await database.query.user.findFirst({ where: { id: userId } });
  return user ? `${user.firstName} ${user.lastName ?? ""}`.trim() : `User ${userId.slice(-4)}`;
}

async function addOrRefreshParticipant(meetingId: string, userId: string, name: string) {
  try {
    return await realtimeKitRequest<Participant>(`/meetings/${meetingId}/participants`, {
      method: "POST",
      body: JSON.stringify({
        custom_participant_id: userId,
        name,
        preset_name: REALTIMEKIT_PRESET_NAME,
      }),
    });
  } catch {
    const participants = await realtimeKitRequest<Participant[]>(`/meetings/${meetingId}/participants`);
    const participant = participants.find((item) => item.custom_participant_id === userId);
    if (!participant) throw new Error("Could not register the RealtimeKit participant.");
    return realtimeKitRequest<Participant>(`/meetings/${meetingId}/participants/${participant.id}/token`, {
      method: "POST",
    });
  }
}

realtimekit.post("/rooms", async (c) => {
  const auth = getAuth(c);
  if (!auth.userId) return c.json({ message: "User needs to be logged in." }, 401);

  const { messageRoomId, enableVideo } = createRoomSchema.parse(await c.req.json());
  let call = await database.query.call.findFirst({ where: { messageRoomId, endedAt: { isNull: true } } });
  let meeting: Meeting;

  if (!call) {
    meeting = await realtimeKitRequest<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify({ title: `Initiate call ${messageRoomId}` }),
    });
    [call] = await database
      .insert(callTable)
      .values({
        roomId: meeting.id,
        messageRoomId,
        initiatorId: auth.userId,
        callType: enableVideo ? "VIDEO" : "VOICE",
        type: "MISSED",
      })
      .returning();
  } else {
    meeting = await realtimeKitRequest<Meeting>(`/meetings/${call.roomId}`);
  }

  const existingParticipant = await database.query.callParticipant.findFirst({
    where: { callId: call.id, userId: auth.userId },
  });
  if (!existingParticipant) {
    await database.insert(callParticipant).values({ callId: call.id, userId: auth.userId });
    if (call.initiatorId !== auth.userId && call.type === "MISSED") {
      await database.update(callTable).set({ type: "ACCEPTED" }).where(eq(callTable.id, call.id));
    }
  }

  const participant = await addOrRefreshParticipant(meeting.id, auth.userId, await getDisplayName(auth.userId));
  if (!participant.token) throw new Error("RealtimeKit did not return a participant token.");

  return c.json({
    meetingId: meeting.id,
    authToken: participant.token,
    room: {
      name: meeting.title ?? `Call ${messageRoomId}`,
      enableVideo,
    },
  });
});

realtimekit.post("/rooms/:meetingId/leave", async (c) => {
  const auth = getAuth(c);
  if (!auth.userId) return c.json({ message: "Please login." }, 401);

  const meetingId = c.req.param("meetingId");
  const call = await database.query.call.findFirst({ where: { roomId: meetingId } });
  if (call) {
    await database
      .update(callParticipant)
      .set({ leftAt: new Date() })
      .where(
        and(
          eq(callParticipant.callId, call.id),
          eq(callParticipant.userId, auth.userId),
          isNull(callParticipant.leftAt),
        ),
      );
  }

  const participants = await realtimeKitRequest<Participant[]>(`/meetings/${meetingId}/participants`);
  const participant = participants.find((item) => item.custom_participant_id === auth.userId);
  if (participant) {
    await realtimeKitRequest(`/meetings/${meetingId}/participants/${participant.id}`, { method: "DELETE" });
  }

  return c.json({ success: true, message: "Left call successfully" });
});

realtimekit.get("/calls/history", async (c) => {
  const auth = getAuth(c);
  if (!auth.userId) return c.json({ message: "Please login." }, 401);

  const calls = await database.query.call.findMany({
    where: {
      OR: [{ initiatorId: auth.userId }, { participants: { userId: auth.userId } }],
    },
    with: {
      initiator: { columns: { id: true, firstName: true, lastName: true, imageUrl: true } },
      participants: {
        with: { user: { columns: { id: true, firstName: true, lastName: true, imageUrl: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ calls });
});

export default realtimekit;
