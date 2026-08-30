import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import app from "#/lib/server/app";

async function handle(request: Request) {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace(/^\/api/, "") || "/";
  return app.fetch(new Request(url, request), env);
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      DELETE: ({ request }) => handle(request),
      GET: ({ request }) => handle(request),
      PATCH: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
      PUT: ({ request }) => handle(request),
    },
  },
});
