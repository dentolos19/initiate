import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

import { user as userTable } from "#/lib/database/schema.js";
import { database } from "#/lib/server/integrations/database.js";
import { getUser } from "#/lib/server/lib/utils.js";

const preferences = new Hono();

const emailPreferencesSchema = z.object({
  maintenance: z.boolean(),
  newsletters: z.boolean(),
  newFeatures: z.boolean(),
  paymentConfirm: z.literal(true),
  promos: z.boolean(),
  reviewReceived: z.boolean(),
  reviewResponse: z.boolean(),
  serviceUpdates: z.boolean(),
});

const defaults = {
  maintenance: true,
  newsletters: true,
  newFeatures: true,
  paymentConfirm: true,
  promos: false,
  reviewReceived: false,
  reviewResponse: false,
  serviceUpdates: true,
} as const;

preferences.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ message: "Sign in to view email preferences." }, 401);

  const stored = user.settings?.emailPreferences;
  const result = emailPreferencesSchema.safeParse({ ...defaults, ...(typeof stored === "object" ? stored : {}) });
  return c.json(result.success ? result.data : defaults);
});

preferences.patch("/", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ message: "Sign in to update email preferences." }, 401);

  const result = emailPreferencesSchema.safeParse(await c.req.json());
  if (!result.success) return c.json({ message: "Invalid email preferences." }, 400);

  await database
    .update(userTable)
    .set({
      settings: {
        ...(user.settings ?? {}),
        emailPreferences: result.data,
      },
    })
    .where(eq(userTable.id, user.id));

  return c.json(result.data);
});

export default preferences;
