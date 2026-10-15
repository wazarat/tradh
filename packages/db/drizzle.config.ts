import { defineConfig } from "drizzle-kit";

// Migrations use the non-pooled connection: DIRECT_URL, or POSTGRES_URL_NON_POOLING from the Vercel Supabase integration.
const url = process.env.DIRECT_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
