import { getSession } from "@/lib/auth/session";
import { hasDatabase } from "@/lib/db";
import { errorResponse } from "@/lib/auth/http";

export async function GET() {
  try {
    const s = await getSession();
    return Response.json(
      { authenticated: Boolean(s), address: s?.walletAddress ?? null, chainId: s?.chainId ?? null, expiresAt: s?.expiresAt?.toISOString() ?? null, databaseConfigured: hasDatabase() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
