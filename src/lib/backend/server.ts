import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { createAuth } from "#/lib/auth/auth.server";
import { generateMappings, generatePrimitives } from "#/lib/backend/primitives";

export default async function createBackend() {
  const session = await createAuth(env.DB).api.getSession({ headers: getRequestHeaders() });

  const primitives = generatePrimitives({
    userId: session?.user.id,
    orgId: session?.session.activeOrganizationId,
  });
  const mappings = generateMappings(primitives);

  return mappings;
}
