import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import { DATABASE_ID } from "./database.config.ts";
import { createAuth } from "#/lib/auth/auth.server";

const miniflare = new Miniflare(convertV4MiniflareOptions({
  compatibilityDate: "2026-10-01",
  d1Databases: { DB: DATABASE_ID },
  resourcePersistencePath: ".wrangler/state/v3",
  modules: true,
  script: "export default { fetch() { return new Response(); } }",
}));

export const auth = createAuth(await miniflare.getD1Database("DB"));
