import type { Context } from "hono";

import { createAuth } from "#/lib/auth/auth.server";

export type RequestAuth = {
  userId: string | null;
  orgId: string | null;
};

export function getAuth(context: Context): RequestAuth {
  return context.get("auth") ?? { userId: null, orgId: null };
}

export { createAuth };
