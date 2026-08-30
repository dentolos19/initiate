import { DurableObject } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import z from "zod";

import { message as messageTable } from "#/lib/database/schema.js";
import { createDatabase } from "#/lib/server/integrations/database.js";
import type { AppDatabase } from "#/lib/server/types.js";

const messageSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
  id: z.string().optional(),
  action: z.enum(["send", "edit", "delete"]).default("send"),
  content: z.string().optional(),
  attachments: z.unknown(),
});

export class MessagingObject extends DurableObject<Env> {
  database: AppDatabase;

  constructor(state: DurableObjectState, environment: Env) {
    super(state, environment);
    this.database = createDatabase(environment.HYPERDRIVE);

    this.ctx.blockConcurrencyWhile(async () => {
      // TODO
    });
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") return new Response("Expected Upgrade: websocket", { status: 426 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

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

      const room = await this.database.query.messageRoom.findFirst({
        where: {
          id: data.roomId,
        },
        // with: {
        //   participants: {
        //     where: {
        //       userId: data.userId,
        //     },
        //   },
        // },
      });

      if (!room) {
        throw new Error("Room not found.");
      }

      // if (room.participants.length === 0) {
      //   throw new Error("User is not a participant in this room.");
      // }

      let messageData: any;

      if (data.action === "send" && !data.id) {
        const [createdMessage] = await this.database
          .insert(messageTable)
          .values({
            roomId: room.id,
            userId: data.userId,
            content: data.content ?? "",
            attachments: data.attachments ?? [],
          })
          .returning({ id: messageTable.id });
        messageData = await this.database.query.message.findFirst({
          where: { id: createdMessage.id },
          with: { user: true },
        });
      } else if (data.action === "edit" && data.id) {
        await this.database
          .update(messageTable)
          .set({ content: data.content, updatedAt: new Date() })
          .where(eq(messageTable.id, data.id));
        messageData = await this.database.query.message.findFirst({
          where: { id: data.id },
          with: { user: true },
        });
      } else if (data.action === "delete" && data.id) {
        await this.database.delete(messageTable).where(eq(messageTable.id, data.id));
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
      this.ctx.getWebSockets().forEach((connectedSocket) => {
        connectedSocket.send(messageRaw);
      });
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
