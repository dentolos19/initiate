import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import { createAuth } from "#/lib/auth/auth.server";

async function handle(request: Request) {
  return createAuth(env.DB).handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
