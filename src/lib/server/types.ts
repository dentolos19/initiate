import type { Context } from "hono";

import type { RequestAuth } from "#/lib/server/integrations/auth.js";
import type { createBucketClient } from "#/lib/server/integrations/bucket.js";
import type { createDatabase } from "#/lib/server/integrations/database.js";
import type { createNotificationClient } from "#/lib/server/integrations/notification.js";

declare module "hono" {
  interface ContextVariableMap {
    auth: RequestAuth;
    integrations: {
      database: AppDatabase;
      bucket: AppBucket;
      notification: AppNotification;
    };
  }
}

export type AppContext = Context<{ Bindings: Env }>;
export type AppDatabase = ReturnType<typeof createDatabase>;
export type AppBucket = ReturnType<typeof createBucketClient>;
export type AppNotification = ReturnType<typeof createNotificationClient>;
