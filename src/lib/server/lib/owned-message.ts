import { and, eq } from "drizzle-orm";

import { message } from "#/lib/database/schema.js";

export function ownedMessage(messageId: string, roomId: string, userId: string) {
  return and(eq(message.id, messageId), eq(message.roomId, roomId), eq(message.userId, userId));
}
