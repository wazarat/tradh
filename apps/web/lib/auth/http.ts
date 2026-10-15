import "server-only";
import { DatabaseUnavailableError } from "@/lib/db";
import { UnauthorizedError } from "./session";

/** Maps known errors to JSON responses; everything else is a 500 without leaking details. */
export function errorResponse(err: unknown): Response {
  if (err instanceof UnauthorizedError) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (err instanceof DatabaseUnavailableError) return Response.json({ error: "database_unavailable" }, { status: 503 });
  console.error(err);
  return Response.json({ error: "internal" }, { status: 500 });
}

/** CSRF guard for state-changing routes: the Origin must match the request host. */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) throw new UnauthorizedError();
  if (new URL(origin).host !== host) throw new UnauthorizedError();
}
