import { generateSiweNonce } from "viem/siwe";
import { siweNonces } from "@tradh/db";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/auth/http";

export async function GET() {
  try {
    const nonce = generateSiweNonce();
    await db().insert(siweNonces).values({ nonce, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    return Response.json({ nonce }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
