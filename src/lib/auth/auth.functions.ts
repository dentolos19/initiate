import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

import { createAuth } from "#/lib/auth/auth.server";

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  return createAuth(env.DB).api.getSession({ headers: getRequestHeaders() });
});
