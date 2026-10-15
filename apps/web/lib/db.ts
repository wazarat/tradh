import "server-only";
import { getDb, type Db } from "@tradh/db";

export class DatabaseUnavailableError extends Error {
  constructor() {
    super("Database is not configured");
    this.name = "DatabaseUnavailableError";
  }
}

/** Returns the Drizzle client, or throws DatabaseUnavailableError when DATABASE_URL is unset. */
export function db(): Db {
  if (!process.env.DATABASE_URL) throw new DatabaseUnavailableError();
  return getDb();
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
