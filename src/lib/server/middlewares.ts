import { createMiddleware } from "hono/factory";

import { createAuth, getAuth } from "#/lib/server/integrations/auth.js";

export function createSessionMiddleware() {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const session = await createAuth(c.env.HYPERDRIVE).api.getSession({
      headers: c.req.raw.headers,
    });
    const requestedOrganizationId = c.req.header("X-Organization-ID");

    c.set("auth", {
      userId: session?.user.id ?? null,
      orgId: requestedOrganizationId ?? session?.session.activeOrganizationId ?? null,
    });

    await next();
  });
}

export function createAuthMiddleware(allowedPaths?: string[]) {
  return createMiddleware(async (c, next) => {
    // Check if the request path is in the allowed paths
    const isAllowed = allowedPaths?.some((allowedPath) => c.req.path.endsWith(allowedPath));

    if (isAllowed) {
      // Allow requests to the allowed paths
      return next();
    }

    // Get authentication information
    const auth = getAuth(c);

    if (!auth?.userId) {
      // Block unauthenticated requests
      return c.json({ message: "Unauthorized." }, 401);
    }

    // Allow authenticated requests
    await next();
  });
}
