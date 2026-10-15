import { desc, eq } from "drizzle-orm";
import { executions, tradeOrders } from "@tradh/db";
import { listAssets } from "@tradh/chain";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/auth/http";
import { requireSession } from "@/lib/auth/session";
import { ensureRegistry } from "@/lib/trading/server";

export async function GET() {
  try {
    const session = await requireSession();
    const d = db();
    const { deploymentIdByAddress } = await ensureRegistry();
    const byDep = new Map([...deploymentIdByAddress.entries()].map(([addr, id]) => [id, listAssets(46630).find((a) => a.address === addr)!]));
    const rows = await d
      .select({ order: tradeOrders, exec: executions })
      .from(tradeOrders)
      .leftJoin(executions, eq(executions.orderId, tradeOrders.id))
      .where(eq(tradeOrders.userId, session.userId))
      .orderBy(desc(tradeOrders.createdAt))
      .limit(100);
    const items = rows.map(({ order, exec }) => ({
      id: order.id,
      state: order.state,
      createdAt: order.createdAt.toISOString(),
      sell: byDep.get(order.sellDeploymentId)?.symbol ?? "?",
      buy: byDep.get(order.buyDeploymentId)?.symbol ?? "?",
      amountIn: exec?.amountIn ?? order.amountIn,
      amountOut: exec?.amountOut ?? order.quotedAmountOut,
      lpFee: exec?.lpFee ?? order.lpFee,
      protocolFee: exec?.protocolFee ?? order.protocolFee,
      txHash: exec?.txHash ?? null,
      gasUsed: exec?.gasUsed?.toString() ?? null,
      effectiveGasPrice: exec?.effectiveGasPrice?.toString() ?? null,
    }));
    return Response.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
