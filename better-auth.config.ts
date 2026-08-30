import { getPlatformProxy } from "wrangler";

import { createAuth } from "#/lib/auth/auth.server";

const { env } = await getPlatformProxy<Env>();

export const auth = createAuth(env.DB);
