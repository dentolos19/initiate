import { Hono } from "hono";
import { getRuntimeKey } from "hono/adapter";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { ENVIRONMENT } from "#/lib/server/environment.js";
// Routes
import { createBucketClient } from "#/lib/server/integrations/bucket.js";
import { createDatabase, runWithDatabase } from "#/lib/server/integrations/database.js";
import { createNotificationClient } from "#/lib/server/integrations/notification.js";
import { createSessionMiddleware } from "#/lib/server/middlewares.js";
import admin from "#/lib/server/routes/admin.js";
import aiAgent from "#/lib/server/routes/ai-agent.js";
import aiChat from "#/lib/server/routes/ai-chat.js";
import ai from "#/lib/server/routes/ai.js";
import assets from "#/lib/server/routes/assets.js";
import communityComments from "#/lib/server/routes/community-comments.js";
import problemChat from "#/lib/server/routes/community-problems-chat.js";
import communityProblems from "#/lib/server/routes/community-problems.js";
import communityTopics from "#/lib/server/routes/community-topics.js";
import community from "#/lib/server/routes/community.js";
import dashboard from "#/lib/server/routes/dashboard.js";
import market from "#/lib/server/routes/market.js";
import messages from "#/lib/server/routes/messages.js";
import notifications from "#/lib/server/routes/notifications.js";
import orderInvoices from "#/lib/server/routes/order-invoices.js";
import orderMilestones from "#/lib/server/routes/order-milestones.js";
import orders from "#/lib/server/routes/orders.js";
import organizationReviews from "#/lib/server/routes/organization-review.js";
import organizations from "#/lib/server/routes/organizations.js";
import payments from "#/lib/server/routes/payments.js";
import preferences from "#/lib/server/routes/preferences.js";
import realtimekit from "#/lib/server/routes/realtimekit.js";
import resources from "#/lib/server/routes/resources.js";
import root from "#/lib/server/routes/root.js";
import servicePlans from "#/lib/server/routes/service-plans.js";
import serviceReviews from "#/lib/server/routes/service-reviews.js";
import services from "#/lib/server/routes/services.js";
import users from "#/lib/server/routes/users.js";

// Initialize Hono Application
const app = new Hono<{ Bindings: Env }>();

// Setup Cross-Origin Resource Sharing (CORS)
if (ENVIRONMENT === "production") {
  app.use(async (c, next) => {
    const path = c.req.path;
    if (path.startsWith("/webhooks/") || path.startsWith("/tests/")) {
      await next();
      return;
    }
    return cors()(c, next);
  });
} else {
  app.use(cors());
}

// Setup Built-In Hono Logging
if (getRuntimeKey() !== "workerd") {
  app.use(logger());
}

// Resolve the Better Auth session once for every embedded API request.
app.use(createSessionMiddleware());

// Setup Error Handling
app.onError((error, c) => {
  console.error(error);
  return c.json({ message: error.message }, 500);
});

// Setup App Integrations
app.use(async (c, next) => {
  const database = createDatabase(c.env.DB);
  const bucket = createBucketClient(c);
  const notification = createNotificationClient(c, database);

  c.set("integrations", {
    database,
    bucket,
    notification,
  });

  await runWithDatabase(database, c.env.VECTORIZE, next);
});

// Setup Routes
app.route("/", root);
app.route("/admin", admin);
app.route("/ai", ai);
app.route("/ai", aiAgent);
app.route("/ai", aiChat);
app.route("/assets", assets);
app.route("/community", communityComments);
app.route("/community", communityProblems);
app.route("/community", communityTopics);
app.route("/community", community);
app.route("/dashboard", dashboard); // TODO: Clean up dashboard route
app.route("/realtimekit", realtimekit);
app.route("/market", market);
app.route("/messages", messages);
app.route("/notifications", notifications);
app.route("/orders", orderInvoices);
app.route("/orders", orderMilestones);
app.route("/orders", orders);
app.route("/organization", organizationReviews);
app.route("/organization", organizationReviews);
app.route("/organization", organizations);
app.route("/payments", payments);
app.route("/preferences", preferences);
app.route("/problem", problemChat);
app.route("/resources", resources);
app.route("/service", servicePlans);
app.route("/service", serviceReviews);
app.route("/service", services);
app.route("/user", users);

// Tests Routes
if (ENVIRONMENT === "development") {
  // NOTE: Insert test routes here
}

// Cloudflare Exports
export { Messenger } from "#/lib/server/integrations/cloudflare/messenger.js";
export { Synchronizer } from "#/lib/server/integrations/cloudflare/synchronizer.js";

export default app;
