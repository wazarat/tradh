import { eq, sql } from "drizzle-orm";
import { portfolioLedgerEvents, portfolios } from "@tradh/db";
import { listAssets } from "@tradh/chain";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/auth/http";
import { requireSession } from "@/lib/auth/session";
import { ensureRegistry } from "@/lib/trading/server";

/** Ledger-derived positions from confirmed executions (not raw wallet balances). */
export async function GET() {
  try {
    const session = await requireSession();
    const d = db();
    const { deploymentIdByAddress } = await ensureRegistry();
    const byDep = new Map([...deploymentIdByAddress.entries()].map(([addr, id]) => [id, listAssets(46630).find((a) => a.address === addr)!]));
    const p = await d.query.portfolios.findFirst({ where: eq(portfolios.userId, session.userId) });
    if (!p) return Response.json({ positions: [], eventCount: 0 });
    const rows = await d
      .select({ dep: portfolioLedgerEvents.assetDeploymentId, qty: sql<string>`sum(${portfolioLedgerEvents.quantityDelta})`, n: sql<number>`count(*)` })
      .from(portfolioLedgerEvents)
      .where(eq(portfolioLedgerEvents.portfolioId, p.id))
      .groupBy(portfolioLedgerEvents.assetDeploymentId);
    const positions = rows.map((r) => ({ symbol: byDep.get(r.dep)?.symbol ?? "?", address: byDep.get(r.dep)?.address ?? null, netQuantity: r.qty, events: Number(r.n) }));
    return Response.json({ positions, eventCount: positions.reduce((a, b) => a + b.events, 0) }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return errorResponse(err);
  }
}
