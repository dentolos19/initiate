import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

function getId(request: Request) {
  const id = decodeURIComponent(new URL(request.url).pathname.split("/").at(-1) ?? "");
  if (!id || id.includes("..") || id.includes("/")) throw new Error("Invalid asset identifier.");
  return id;
}

function getHeaders(object: R2Object, request: Request) {
  const headers = new Headers();
  const name = new URL(request.url).searchParams.get("name") ?? object.customMetadata?.name;

  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", object.httpEtag);
  if (name) headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(name)}`);
  if (!headers.has("Content-Type") && object.customMetadata?.type) {
    headers.set("Content-Type", object.customMetadata.type);
  }

  return headers;
}

async function head(request: Request) {
  const object = await env.BUCKET.head(getId(request));
  if (!object) return new Response("Asset not found.", { status: 404 });

  const headers = getHeaders(object, request);
  headers.set("Content-Length", object.size.toString());
  return new Response(null, { headers });
}

function getRange(range: R2Range, size: number) {
  if ("suffix" in range) {
    const length = Math.min(range.suffix, size);
    return { length, offset: size - length };
  }

  const offset = range.offset ?? 0;
  return { length: Math.min(range.length ?? size - offset, size - offset), offset };
}

async function get(request: Request) {
  const object = await env.BUCKET.get(getId(request), { range: request.headers });
  if (!object) return new Response("Asset not found.", { status: 404 });

  const headers = getHeaders(object, request);
  if (!object.range) {
    headers.set("Content-Length", object.size.toString());
    return new Response(object.body, { headers });
  }

  const range = getRange(object.range, object.size);
  headers.set("Content-Length", range.length.toString());
  headers.set("Content-Range", `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`);
  return new Response(object.body, { headers, status: 206 });
}

export const Route = createFileRoute("/assets/$id")({
  server: {
    handlers: {
      GET: ({ request }) => get(request),
      HEAD: ({ request }) => head(request),
    },
  },
});
