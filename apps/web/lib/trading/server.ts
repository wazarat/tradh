import "server-only";
import { and, eq } from "drizzle-orm";
import { decodeEventLog, type Hex } from "viem";
import { MockSpotExchangeAbi, getDeployment, getPublicClient, listAssets } from "@tradh/chain";
import { fromUnits } from "@tradh/core";
import { assetDeployments, assets, executions, portfolioLedgerEvents, portfolios, tradeOrders, tradingVenues, transactionReceipts, wallets } from "@tradh/db";
import { db } from "@/lib/db";
import type { SessionInfo } from "@/lib/auth/session";

const CHAIN_ID = 46630;

/** Ensures asset / venue rows exist for the deployed manifest (idempotent). Returns deployment ids by address. */
export async function ensureRegistry(): Promise<{ deploymentIdByAddress: Map<string, string>; venueId: string | null }> {
  const d = db();
  const manifest = getDeployment(CHAIN_ID);
  const map = new Map<string, string>();
  if (!manifest?.deployed) return { deploymentIdByAddress: map, venueId: null };

  for (const a of listAssets(CHAIN_ID)) {
    let assetRow = await d.query.assets.findFirst({ where: and(eq(assets.symbol, a.symbol), eq(assets.kind, a.kind)) });
    if (!assetRow) {
      [assetRow] = await d.insert(assets).values({ symbol: a.symbol, name: a.name, kind: a.kind, underlyingSymbol: a.underlyingSymbol, isQuote: a.isQuote }).returning();
    }
    let dep = await d.query.assetDeployments.findFirst({ where: and(eq(assetDeployments.chainId, CHAIN_ID), eq(assetDeployments.address, a.address)) });
    if (!dep) {
      [dep] = await d.insert(assetDeployments).values({ assetId: assetRow!.id, chainId: CHAIN_ID, address: a.address, decimals: a.decimals, verified: true, verificationSource: "tradh deployment manifest" }).returning();
    }
    map.set(a.address, dep!.id);
  }
  const dexAddr = manifest.contracts.MockSpotExchange?.address.toLowerCase();
  let venueId: string | null = null;
  if (dexAddr) {
    let v = await d.query.tradingVenues.findFirst({ where: and(eq(tradingVenues.chainId, CHAIN_ID), eq(tradingVenues.address, dexAddr)) });
    if (!v) [v] = await d.insert(tradingVenues).values({ chainId: CHAIN_ID, address: dexAddr, name: "MockSpotExchange (testnet)", kind: "mock-spot-exchange" }).returning();
    venueId = v!.id;
  }
  return { deploymentIdByAddress: map, venueId };
}

export async function ensureOnchainPortfolio(session: SessionInfo): Promise<{ portfolioId: string; walletId: string }> {
  const d = db();
  const w = await d.query.wallets.findFirst({ where: and(eq(wallets.address, session.walletAddress), eq(wallets.chainId, session.chainId)) });
  if (!w) throw new Error("wallet row missing for session");
  let p = await d.query.portfolios.findFirst({ where: and(eq(portfolios.userId, session.userId), eq(portfolios.book, "onchain"), eq(portfolios.chainId, session.chainId)) });
  if (!p) [p] = await d.insert(portfolios).values({ userId: session.userId, walletId: w.id, book: "onchain", chainId: session.chainId, name: "Testnet portfolio" }).returning();
  return { portfolioId: p!.id, walletId: w.id };
}

export interface ConfirmResult {
  status: "confirmed" | "failed";
  txHash: Hex;
  blockNumber: string;
  amountIn?: string;
  amountOut?: string;
}

/**
 * Fetches the receipt for `txHash`, verifies it is a Swap on our exchange sent by the session wallet,
 * and records receipt + execution + ledger events. Idempotent on (chainId, txHash).
 */
export async function confirmSwap(session: SessionInfo, txHash: Hex, orderId?: string): Promise<ConfirmResult> {
  const d = db();
  const manifest = getDeployment(CHAIN_ID);
  const dex = manifest?.contracts.MockSpotExchange?.address.toLowerCase();
  if (!dex) throw new Error("exchange not deployed");

  const client = getPublicClient();
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.from.toLowerCase() !== session.walletAddress.toLowerCase()) throw new Error("transaction was not sent by the signed-in wallet");
  if ((receipt.to ?? "").toLowerCase() !== dex) throw new Error("transaction is not a swap on the tradh exchange");

  const existing = await d.query.transactionReceipts.findFirst({ where: and(eq(transactionReceipts.chainId, CHAIN_ID), eq(transactionReceipts.txHash, txHash)) });
  const status = receipt.status === "success" ? "confirmed" : "failed";
  if (!existing) {
    await d.insert(transactionReceipts).values({
      chainId: CHAIN_ID,
      txHash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      status: receipt.status,
      from: receipt.from.toLowerCase(),
      to: receipt.to?.toLowerCase() ?? null,
      gasUsed: receipt.gasUsed,
      effectiveGasPrice: receipt.effectiveGasPrice,
      logs: receipt.logs.map((l) => ({ address: l.address, topics: l.topics, data: l.data, logIndex: l.logIndex })),
    });
  }

  let swap: { tokenIn: string; tokenOut: string; amountIn: bigint; amountOut: bigint; lpFee: bigint; protocolFee: bigint; logIndex: number } | undefined;
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== dex) continue;
    try {
      const ev = decodeEventLog({ abi: MockSpotExchangeAbi, data: log.data, topics: log.topics });
      if (ev.eventName === "Swap") {
        const a = ev.args as { tokenIn: string; tokenOut: string; amountIn: bigint; amountOut: bigint; lpFee: bigint; protocolFee: bigint };
        swap = { ...a, logIndex: log.logIndex };
      }
    } catch {}
  }

  const { deploymentIdByAddress } = await ensureRegistry();
  const { portfolioId, walletId } = await ensureOnchainPortfolio(session);
  const { venueId } = await ensureRegistry();

  let order = orderId ? await d.query.tradeOrders.findFirst({ where: and(eq(tradeOrders.id, orderId), eq(tradeOrders.userId, session.userId)) }) : undefined;
  if (!order && swap && venueId) {
    const sellDep = deploymentIdByAddress.get(swap.tokenIn.toLowerCase());
    const buyDep = deploymentIdByAddress.get(swap.tokenOut.toLowerCase());
    if (sellDep && buyDep) {
      const sellAsset = listAssets(CHAIN_ID).find((a) => a.address === swap!.tokenIn.toLowerCase())!;
      const buyAsset = listAssets(CHAIN_ID).find((a) => a.address === swap!.tokenOut.toLowerCase())!;
      [order] = await d
        .insert(tradeOrders)
        .values({
          userId: session.userId,
          walletId,
          venueId,
          sellDeploymentId: sellDep,
          buyDeploymentId: buyDep,
          amountIn: fromUnits(swap.amountIn, sellAsset.decimals).toString(),
          minAmountOut: "0",
          quotedAmountOut: fromUnits(swap.amountOut, buyAsset.decimals).toString(),
          quotedPriceImpactBps: 0,
          slippageBps: 0,
          state: status,
          idempotencyKey: `tx:${txHash}`,
          quoteExpiresAt: new Date(),
        })
        .onConflictDoNothing()
        .returning();
    }
  }

  if (order) {
    await d.update(tradeOrders).set({ state: status, updatedAt: new Date() }).where(eq(tradeOrders.id, order.id));
    const sellAsset = listAssets(CHAIN_ID).find((a) => deploymentIdByAddress.get(a.address) === order!.sellDeploymentId);
    const buyAsset = listAssets(CHAIN_ID).find((a) => deploymentIdByAddress.get(a.address) === order!.buyDeploymentId);
    await d
      .insert(executions)
      .values({
        orderId: order.id,
        txHash,
        chainId: CHAIN_ID,
        amountIn: swap && sellAsset ? fromUnits(swap.amountIn, sellAsset.decimals).toString() : null,
        amountOut: swap && buyAsset ? fromUnits(swap.amountOut, buyAsset.decimals).toString() : null,
        lpFee: swap && sellAsset ? fromUnits(swap.lpFee, sellAsset.decimals).toString() : null,
        protocolFee: swap && sellAsset ? fromUnits(swap.protocolFee, sellAsset.decimals).toString() : null,
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        state: status,
      })
      .onConflictDoNothing();

    if (status === "confirmed" && swap && sellAsset && buyAsset) {
      const occurredAt = new Date();
      await d
        .insert(portfolioLedgerEvents)
        .values([
          { portfolioId, kind: "trade_out", assetDeploymentId: order.sellDeploymentId, quantityDelta: `-${fromUnits(swap.amountIn, sellAsset.decimals).toString()}`, txHash, logIndex: swap.logIndex, occurredAt, metadata: { lpFee: swap.lpFee.toString(), protocolFee: swap.protocolFee.toString() } },
          { portfolioId, kind: "trade_in", assetDeploymentId: order.buyDeploymentId, quantityDelta: fromUnits(swap.amountOut, buyAsset.decimals).toString(), txHash, logIndex: swap.logIndex, occurredAt },
        ])
        .onConflictDoNothing();
    }
  }

  return {
    status,
    txHash,
    blockNumber: receipt.blockNumber.toString(),
    amountIn: swap ? swap.amountIn.toString() : undefined,
    amountOut: swap ? swap.amountOut.toString() : undefined,
  };
}
