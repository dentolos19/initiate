import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { createDatabase } from "#/lib/server/integrations/database";
import { deliverNotification, type NotificationMessage } from "#/lib/server/integrations/notification";

export { MessagingObject as Messaging } from "#/lib/server/integrations/cloudflare/messaging";
export { SynchronizeWorkflow } from "#/lib/server/integrations/cloudflare/synchronize";

const start = createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});

export default {
  ...start,
  async queue(batch: MessageBatch<NotificationMessage>, env: Env) {
    const database = createDatabase(env.HYPERDRIVE);

    for (const message of batch.messages) {
      try {
        await deliverNotification(env, database, message.body);
        message.ack();
      } catch (error) {
        console.error("Notification delivery failed", error);
        message.retry();
      }
    }
  },
};
