import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { auditLogs, sessions, users, wallets } from "@tradh/db";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "tradh_session";
export const SESSION_TTL_SECONDS = 7 * 24 * 3600;

export interface SessionInfo {
  sessionId: string;
  userId: string;
  walletAddress: `0x${string}`;
  chainId: number;
  expiresAt: Date;
}

function cookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  };
}

/** Finds or creates the user that owns `address` on `chainId` and opens a session. */
export async function createSessionForWallet(address: `0x${string}`, chainId: number, userAgent: string | null, ip: string | null): Promise<SessionInfo> {
  const d = db();
  const addr = address.toLowerCase();
  const existing = await d.query.wallets.findFirst({ where: and(eq(wallets.address, addr), eq(wallets.chainId, chainId)) });
  let userId = existing?.userId;
  if (!userId) {
    const [u] = await d.insert(users).values({}).returning({ id: users.id });
    userId = u!.id;
    await d.insert(wallets).values({ userId, address: addr, chainId, isPrimary: true });
  }
  const id = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await d.insert(sessions).values({ id, userId, walletAddress: addr, chainId, expiresAt, userAgent });
  await d.insert(auditLogs).values({ userId, actor: "user", action: "auth.sign_in", subjectType: "wallet", subjectId: addr, ip, detail: { chainId } });
  (await cookies()).set(SESSION_COOKIE, id, cookieOptions(expiresAt));
  return { sessionId: id, userId, walletAddress: addr as `0x${string}`, chainId, expiresAt };
}

/** Reads the current session from the cookie; returns null when absent, expired or DB unavailable. */
export async function getSession(): Promise<SessionInfo | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id || !process.env.DATABASE_URL) return null;
  const row = await db().query.sessions.findFirst({ where: and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())) });
  if (!row) return null;
  return { sessionId: row.id, userId: row.userId, walletAddress: row.walletAddress as `0x${string}`, chainId: row.chainId, expiresAt: row.expiresAt };
}

export async function requireSession(): Promise<SessionInfo> {
  const s = await getSession();
  if (!s) throw new UnauthorizedError();
  return s;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id && process.env.DATABASE_URL) {
    await db().delete(sessions).where(eq(sessions.id, id));
  }
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
