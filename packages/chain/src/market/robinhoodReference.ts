import { z } from "zod";
import type { PriceSnapshot } from "./types";

/**
 * Robinhood Stock Token reference prices (official API). These describe MAINNET (4663)
 * issuer tokens and the underlying market; they are informational for Phase 1 and must
 * never be presented as executable testnet prices. Network failures resolve to `undefined`
 * so the platform keeps working when the provider is unavailable (spec §3).
 */
const RHJ_BASE = "https://api.robinhood.com/rhj";

const quoteSchema = z.object({
  tokenSymbol: z.string(),
  bid: z.string(),
  ask: z.string(),
  tokenBid: z.string().optional(),
  tokenAsk: z.string().optional(),
  currency: z.string(),
  isTradingHalt: z.boolean(),
  generatedAt: z.string(),
  dailyHigh: z.string().optional(),
  dailyLow: z.string().optional(),
});

const pricesResponseSchema = z.object({ quotes: z.array(quoteSchema) });

export interface ReferenceQuote {
  symbol: string;
  bid: string;
  ask: string;
  mid: string;
  halted: boolean;
  generatedAt: string;
}

export async function fetchReferenceQuote(symbol: string, fetchImpl: typeof fetch = fetch): Promise<ReferenceQuote | undefined> {
  try {
    const res = await fetchImpl(`${RHJ_BASE}/prices/${encodeURIComponent(symbol)}`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return undefined;
    const parsed = pricesResponseSchema.safeParse(await res.json());
    if (!parsed.success) return undefined;
    const q = parsed.data.quotes.find((x) => x.tokenSymbol.toUpperCase() === symbol.toUpperCase());
    if (!q) return undefined;
    // mid as decimal string without float math: average via string→scaled ints
    const scale = 8;
    const toInt = (s: string) => BigInt(Math.round(Number(s) * 10 ** scale)); // reference only; not used for execution
    const mid = (toInt(q.bid) + toInt(q.ask)) / 2n;
    const midStr = `${mid / BigInt(10 ** scale)}.${(mid % BigInt(10 ** scale)).toString().padStart(scale, "0")}`;
    return { symbol: q.tokenSymbol, bid: q.bid, ask: q.ask, mid: midStr, halted: q.isTradingHalt, generatedAt: q.generatedAt };
  } catch {
    return undefined;
  }
}

export function toSnapshot(assetId: string, symbol: string, q: ReferenceQuote, now = Date.now(), maxAgeSeconds = 600): PriceSnapshot {
  const observed = Date.parse(q.generatedAt);
  const age = Math.max(0, Math.floor((now - observed) / 1000));
  return {
    assetId,
    symbol,
    price: q.mid,
    source: "robinhood-reference",
    observedAt: new Date(observed).toISOString(),
    ageSeconds: age,
    stale: age > maxAgeSeconds,
    halted: q.halted,
  };
}
