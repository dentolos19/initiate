import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import * as schema from "#/lib/database/schema";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, BETTER_AUTH_URLS } from "#/lib/server/environment";
import { createDrizzleDatabase } from "#/lib/server/integrations/database";

export function createAuth(connection: D1Database) {
  const database = createDrizzleDatabase(connection);

  return betterAuth({
    appName: "Initiate",
    baseURL: BETTER_AUTH_URL,
    secret: BETTER_AUTH_SECRET,
    trustedOrigins: BETTER_AUTH_URLS,
    database: drizzleAdapter(database, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      modelName: "user",
      fields: {
        name: "firstName",
        email: "email",
        emailVerified: "emailVerified",
        image: "imageUrl",
      },
      additionalFields: {
        lastName: {
          type: "string",
          required: false,
        },
      },
    },
    session: {
      modelName: "authSession",
    },
    account: {
      modelName: "authAccount",
    },
    verification: {
      modelName: "authVerification",
    },
    plugins: [
      organization({
        schema: {
          organization: {
            modelName: "organization",
            fields: {
              logo: "imageUrl",
              metadata: "authMetadata",
            },
          },
          member: {
            modelName: "authMember",
          },
          invitation: {
            modelName: "authInvitation",
          },
        },
      }),
      tanstackStartCookies(),
    ],
  });
}

export type AppAuth = ReturnType<typeof createAuth>;
