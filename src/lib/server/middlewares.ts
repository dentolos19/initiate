import { createMiddleware } from "hono/factory";

import { createAuth, getAuth } from "#/lib/server/integrations/auth.js";
import { createDatabase } from "#/lib/server/integrations/database.js";
import { resolveOrganizationAccess } from "#/lib/server/lib/organization-access.js";

export function createSessionMiddleware() {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const session = await createAuth(c.env.DB).api.getSession({
      headers: c.req.raw.headers,
    });
    const requestedOrganizationId = c.req.header("X-Organization-ID");
    const userId = session?.user.id ?? null;
    const organization = await resolveOrganizationAccess(
      userId,
      requestedOrganizationId,
      session?.session.activeOrganizationId ?? null,
      async (userId, organizationId) => Boolean(await createDatabase(c.env.DB).query.authMember.findFirst({
        where: { userId, organizationId },
        columns: { id: true },
      })),
    );
    if (organization.denied) {
      return c.json({ message: "You are not a member of this organization." }, userId ? 403 : 401);
    }

    c.set("auth", {
      userId,
      orgId: organization.organizationId,
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
