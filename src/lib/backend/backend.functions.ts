import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { z } from "zod";

import app from "#/lib/server/app";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const backendRequest = z.object({
  endpoint: z.string().startsWith("/"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  body: z.unknown().optional(),
  organizationId: z.string().optional(),
});

export const callBackend = createServerFn({ method: "POST" })
  .validator(backendRequest)
  .handler(async ({ data }) => {
    const incomingHeaders = getRequestHeaders();
    const headers = new Headers(incomingHeaders);
    headers.set("Accept", "application/json");
    if (data.organizationId) headers.set("X-Organization-ID", data.organizationId);
    if (data.body !== undefined) headers.set("Content-Type", "application/json");

    const request = new Request(new URL(data.endpoint, "http://initiate.internal"), {
      method: data.method,
      headers,
      body: data.body === undefined ? undefined : JSON.stringify(data.body),
    });
    const response = await app.fetch(request, env);
    const body = (await response.json().catch(() => null)) as JsonValue;

    return { body, ok: response.ok, status: response.status };
  });
