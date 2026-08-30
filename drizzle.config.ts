import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://initiate:initiate@localhost:5432/initiate";

export default defineConfig({
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: "postgresql",
  out: "migrations",
  schema: "src/lib/database/schema.ts",
});
