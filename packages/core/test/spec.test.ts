import { describe, expect, it } from "vitest";
import { strategySpecSchema, canonicalize, type StrategySpecInput } from "../src/strategy/spec";

const A = { chainId: 46630 as const, address: "0x1111111111111111111111111111111111111111", symbol: "mAAPL" };
const N = { chainId: 46630 as const, address: "0x2222222222222222222222222222222222222222", symbol: "mNVDA" };
const USD = { chainId: 46630 as const, address: "0x3333333333333333333333333333333333333333", symbol: "mUSD" };

function base(): StrategySpecInput {
  const now = new Date().toISOString();
  return {
    id: "6f1b4a1e-4b8e-4c4c-9c1e-3d2f6b8a9c10",
    ownerWallet: "0x4444444444444444444444444444444444444444",
    name: "Core",
    version: 1,
    network: "robinhood-chain",
    chainId: 46630,
    quoteAsset: USD,
    eligibleAssets: [A, N],
    targetAllocations: [
      { asset: A, weightPct: "60" },
      { asset: N, weightPct: "40" },
    ],
    signals: [{ type: "drift", thresholdPoints: "5" }],
    rebalance: { driftUnit: "percentagePoints", mode: "toTarget", minTradeUsd: "10" },
    evaluation: "daily",
    risk: { maxTradeUsd: "200", maxDailyUsd: "1000", maxAllocationPct: "60", minReserveUsd: "0", maxSlippageBps: 100, maxPriceAgeSeconds: 600, leverage: false },
    allowedVenues: ["0x5555555555555555555555555555555555555555"],
    executionMode: "approval",
    authorization: { status: "none" },
    createdAt: now,
    updatedAt: now,
  };
}

describe("strategySpecSchema", () => {
  it("accepts a valid spec and lowercases addresses", () => {
    const s = strategySpecSchema.parse(base());
    expect(s.targetAllocations[0]!.asset.address).toBe(A.address.toLowerCase());
  });
  it("rejects allocations that do not sum to 100", () => {
    const s = base();
    s.targetAllocations[1]!.weightPct = "30";
    expect(strategySpecSchema.safeParse(s).success).toBe(false);
  });
  it("rejects automated mode without granted authorization", () => {
    const s = base();
    s.executionMode = "automated";
    expect(strategySpecSchema.safeParse(s).success).toBe(false);
  });
  it("canonicalizes deterministically", () => {
    expect(canonicalize({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe('{"a":[2,{"c":2,"d":1}],"b":1}');
  });
});
