import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Serverless-safe client for Supabase. DATABASE_URL should be the transaction-mode pooler
 * (port 6543), which requires `prepare: false`. One connection per lambda, cached on globalThis.
 */
const globalForDb = globalThis as unknown as { __tradhSql?: ReturnType<typeof postgres> };

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalForDb.__tradhSql) {
    globalForDb.__tradhSql = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10 });
  }
  return drizzle(globalForDb.__tradhSql, { schema });
}

export type Db = ReturnType<typeof getDb>;
export { schema };
