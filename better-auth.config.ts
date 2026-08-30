import "dotenv/config";
import { createAuth } from "#/lib/auth/auth.server";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required to inspect the Better Auth schema.");

export const auth = createAuth(process.env.DATABASE_URL);
