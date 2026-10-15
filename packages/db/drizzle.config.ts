import { defineConfig } from "drizzle-kit";

// DIRECT_URL is the non-pooled Supabase connection (port 5432) used for migrations.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
