/** A price observation. `price` is a decimal string in USD. */
export interface PriceSnapshot {
  assetId: string;
  symbol: string;
  price: string;
  /** Where the number came from. Reference prices are NOT executable quotes. */
  source: "mock-oracle" | "robinhood-reference";
  observedAt: string; // ISO
  ageSeconds: number;
  stale: boolean;
  halted: boolean;
  /** 24h reference change in percent, when the source provides one. */
  changePct?: string;
}

export const DEFAULT_MAX_PRICE_AGE_SECONDS = 600;

export function marketState(s: PriceSnapshot | undefined, neutralThresholdPct = 0.25): "positive" | "negative" | "pending" | "neutral" {
  if (!s || s.stale || s.halted) return "pending";
  if (s.changePct === undefined) return "neutral";
  const c = Number(s.changePct);
  if (Math.abs(c) < neutralThresholdPct) return "neutral";
  return c > 0 ? "positive" : "negative";
}
