import { inferAdditionalFields, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import type { AppAuth } from "#/lib/auth/auth.server";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<AppAuth>(), organizationClient()],
});
