import { DurableObject } from "cloudflare:workers";
import z from "zod";

import { message as messageTable } from "#/lib/database/schema.js";
import { createDatabase } from "#/lib/server/integrations/database.js";
import { ownedMessage } from "#/lib/server/lib/owned-message.js";
import { canAccessRoom } from "#/lib/server/lib/room-access.js";
import type { AppDatabase } from "#/lib/server/types.js";

const messageSchema = z.object({
  id: z.string().optional(),
  action: z.enum(["send", "edit", "delete"]).default("send"),
  content: z.string().optional(),
  attachments: z.array(z.unknown()).default([]),
});
const socketIdentitySchema = z.object({ userId: z.string().min(1), roomId: z.string().min(1) });

export class Messenger extends DurableObject<Env> {
  database: AppDatabase;

  constructor(state: DurableObjectState, environment: Env) {
    super(state, environment);
    this.database = createDatabase(environment.DB);

    this.ctx.blockConcurrencyWhile(async () => {
      for (const socket of this.ctx.getWebSockets()) {
        if (!socketIdentitySchema.safeParse(socket.deserializeAttachment()).success) {
          socket.close(1008, "Reconnect to authenticate.");
        }
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") return new Response("Expected Upgrade: websocket", { status: 426 });

    const identity = socketIdentitySchema.safeParse({
      userId: request.headers.get("X-Initiate-User-Id"),
      roomId: request.headers.get("X-Initiate-Room-Id"),
    });
    if (!identity.success) return new Response("Unauthorized.", { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.serializeAttachment(identity.data);
    this.ctx.acceptWebSocket(server);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(socket: WebSocket, message: string | ArrayBuffer) {
    try {
      if (typeof message !== "string") {
        throw new Error("Unable to process message, expected a string.");
      }

      const { success, data } = messageSchema.safeParse(JSON.parse(message));

      if (!success) {
        throw new Error("Invalid message format.");
      }
      const identity = socketIdentitySchema.safeParse(socket.deserializeAttachment());
      if (!identity.success) {
        socket.close(1008, "Reconnect to authenticate.");
        return;
      }

      const room = await this.database.query.messageRoom.findFirst({
        where: {
          id: identity.data.roomId,
        },
        with: {
          users: { columns: { userId: true } },
          organizations: { columns: { organizationId: true } },
        },
      });

      if (!room) {
        throw new Error("Room not found.");
      }
      const isMember = async (userId: string, organizationId: string) => Boolean(
        await this.database.query.authMember.findFirst({ where: { userId, organizationId }, columns: { id: true } }),
      );
      if (!(await canAccessRoom(room, identity.data.userId, isMember))) {
        socket.close(1008, "Room access revoked.");
        return;
      }

      let messageData: unknown;

      if (data.action === "send" && !data.id) {
        const [createdMessage] = await this.database
          .insert(messageTable)
          .values({
            roomId: room.id,
            userId: identity.data.userId,
            content: data.content ?? "",
            attachments: data.attachments ?? [],
          })
          .returning({ id: messageTable.id });
        messageData = await this.database.query.message.findFirst({
          where: { id: createdMessage.id },
          with: { user: true },
        });
      } else if (data.action === "edit" && data.id) {
        const [updatedMessage] = await this.database
          .update(messageTable)
          .set({ content: data.content, updatedAt: new Date() })
          .where(ownedMessage(data.id, room.id, identity.data.userId))
          .returning({ id: messageTable.id });
        if (!updatedMessage) throw new Error("Message not found.");
        messageData = await this.database.query.message.findFirst({
          where: { id: updatedMessage.id },
          with: { user: true },
        });
      } else if (data.action === "delete" && data.id) {
        const [deletedMessage] = await this.database
          .delete(messageTable)
          .where(ownedMessage(data.id, room.id, identity.data.userId))
          .returning({ id: messageTable.id });
        if (!deletedMessage) throw new Error("Message not found.");
      } else {
        // No Action
      }

      const messageRaw = JSON.stringify({
        id: data.id,
        action: data.action,
        content: data.content,
        data: messageData,
      });

      // Broadcast message to all connected clients
      for (const connectedSocket of this.ctx.getWebSockets()) {
        const connectedIdentity = socketIdentitySchema.safeParse(connectedSocket.deserializeAttachment());
        if (!connectedIdentity.success || connectedIdentity.data.roomId !== room.id ||
            !(await canAccessRoom(room, connectedIdentity.data.userId, isMember))) {
          connectedSocket.close(1008, "Reconnect to authenticate.");
          continue;
        }
        connectedSocket.send(messageRaw);
      }
    } catch (error) {
      let errorMessageRaw: string;

      if (error instanceof Error) {
        errorMessageRaw = JSON.stringify({
          error: error.message,
        });
      } else {
        errorMessageRaw = JSON.stringify({
          error: "An error occurred while processing the message.",
        });
      }

      // Send error message back to the client
      socket.send(errorMessageRaw);
    }
  }

  async webSocketError(socket: WebSocket, error: unknown) {
    console.error(JSON.stringify({ message: "WebSocket error", error: String(error) }));
    socket.close(1011, "Internal Server Error");
  }

  async webSocketClose(socket: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log(JSON.stringify({ message: "WebSocket closed", code, reason, wasClean }));
    socket.close(code, reason);
  }
}
