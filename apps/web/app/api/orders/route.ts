import { and, eq } from "drizzle-orm";
import { tradeOrders } from "@tradh/db";
import { db } from "@/lib/db";
import { assertSameOrigin, errorResponse } from "@/lib/auth/http";
import { requireSession } from "@/lib/auth/session";
import { ensureOnchainPortfolio, ensureRegistry } from "@/lib/trading/server";
import { createOrderSchema } from "@/lib/trading/types";

/** Creates a draft order from a quote the client is about to sign. Idempotent on idempotencyKey. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireSession();
    const parsed = createOrderSchema.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: "bad_request", issues: parsed.error.issues }, { status: 400 });
    const input = parsed.data;
    const d = db();
    const existing = await d.query.tradeOrders.findFirst({ where: and(eq(tradeOrders.idempotencyKey, input.idempotencyKey), eq(tradeOrders.userId, session.userId)) });
    if (existing) return Response.json({ id: existing.id, state: existing.state });

    const { deploymentIdByAddress, venueId } = await ensureRegistry();
    const sellDep = deploymentIdByAddress.get(input.sellAddress.toLowerCase());
    const buyDep = deploymentIdByAddress.get(input.buyAddress.toLowerCase());
    if (!sellDep || !buyDep || !venueId) return Response.json({ error: "unknown_asset_or_venue" }, { status: 400 });
    const { walletId } = await ensureOnchainPortfolio(session);

    const [row] = await d
      .insert(tradeOrders)
      .values({
        userId: session.userId,
        walletId,
        venueId,
        sellDeploymentId: sellDep,
        buyDeploymentId: buyDep,
        amountIn: input.amountIn,
        minAmountOut: input.minAmountOut,
        quotedAmountOut: input.quotedAmountOut,
        quotedPriceImpactBps: input.quotedPriceImpactBps,
        slippageBps: input.slippageBps,
        lpFee: input.lpFee,
        protocolFee: input.protocolFee,
        quoteExpiresAt: new Date(input.quoteExpiresAt),
        state: "awaiting",
        idempotencyKey: input.idempotencyKey,
      })
      .returning({ id: tradeOrders.id, state: tradeOrders.state });
    return Response.json({ id: row!.id, state: row!.state }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
