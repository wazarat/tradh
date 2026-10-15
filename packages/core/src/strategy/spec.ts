import { z } from "zod";
import { D } from "../decimal";
import { EXECUTION_MODES } from "../trade/states";

/**
 * StrategySpec (spec §6.2) — the single source of truth for what a strategy is.
 * Money and weights are decimal strings, never JS numbers. Assets are identified by
 * (chainId, address), never by ticker alone.
 */
export const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "invalid EVM address")
  .transform((s) => s.toLowerCase() as `0x${string}`);

export const decimalString = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, "decimal string expected")
  .refine((s) => {
    try {
      new D(s);
      return true;
    } catch {
      return false;
    }
  }, "unparseable decimal");

const nonNegativeDecimal = decimalString.refine((s) => new D(s).gte(0), "must be ≥ 0");
const positiveDecimal = decimalString.refine((s) => new D(s).gt(0), "must be > 0");
const percent = decimalString.refine((s) => {
  const d = new D(s);
  return d.gte(0) && d.lte(100);
}, "percent must be within 0..100");

export const SUPPORTED_CHAIN_IDS = [46630, 4663] as const;

export const assetRefSchema = z.object({
  chainId: z.literal(46630).or(z.literal(4663)),
  address: addressSchema,
  symbol: z.string().min(1).max(16),
});
export type AssetRef = z.infer<typeof assetRefSchema>;

export const targetAllocationSchema = z.object({
  asset: assetRefSchema,
  /** Target weight in percent of portfolio value, decimal string ("40"). */
  weightPct: percent,
});

export const signalConditionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("drift"),
    /** Rebalance when any position deviates by more than this many percentage POINTS. */
    thresholdPoints: positiveDecimal,
  }),
  z.object({
    type: z.literal("schedule"),
    /** Always rebalance on evaluation (calendar rebalancing). */
  }),
  z.object({
    type: z.literal("priceMove"),
    asset: assetRefSchema,
    /** Relative move in percent over the lookback, positive or negative. */
    changePct: decimalString,
    lookbackHours: z.number().int().positive().max(24 * 30),
  }),
]);

export const rebalancePolicySchema = z.object({
  /** Drift is ALWAYS percentage points (spec §6.2); recorded explicitly for clarity. */
  driftUnit: z.literal("percentagePoints"),
  /** Bring positions all the way to target, or only to within the band. */
  mode: z.enum(["toTarget", "toBand"]),
  /** Ignore trades smaller than this USD notional. */
  minTradeUsd: nonNegativeDecimal,
});

export const evaluationFrequencySchema = z.enum(["hourly", "every4h", "daily", "weekly"]);

export const riskLimitsSchema = z.object({
  maxTradeUsd: positiveDecimal,
  maxDailyUsd: positiveDecimal,
  maxAllocationPct: percent,
  /** Cash reserve that may never be deployed, in quote-asset units (mUSD). */
  minReserveUsd: nonNegativeDecimal,
  maxSlippageBps: z.number().int().min(1).max(500),
  /** Reject evaluation when the freshest price is older than this. */
  maxPriceAgeSeconds: z.number().int().min(10).max(24 * 3600),
  leverage: z.literal(false),
});

export const strategySpecSchema = z
  .object({
    id: z.string().uuid(),
    ownerWallet: addressSchema,
    name: z.string().min(1).max(80),
    description: z.string().max(2000).default(""),
    version: z.number().int().positive(),
    network: z.literal("robinhood-chain"),
    chainId: z.literal(46630).or(z.literal(4663)),
    quoteAsset: assetRefSchema,
    eligibleAssets: z.array(assetRefSchema).min(1).max(12),
    targetAllocations: z.array(targetAllocationSchema).min(1).max(12),
    /** Idle cash target in percent; allocations + cash must equal 100. */
    cashPct: percent.default("0"),
    signals: z.array(signalConditionSchema).min(1),
    rebalance: rebalancePolicySchema,
    evaluation: evaluationFrequencySchema,
    risk: riskLimitsSchema,
    allowedVenues: z.array(addressSchema).min(1),
    executionMode: z.enum(EXECUTION_MODES),
    authorization: z.object({
      status: z.enum(["none", "requested", "granted", "revoked", "expired"]),
      policyHash: z.string().regex(/^0x[0-9a-f]{64}$/).optional(),
      expiresAt: z.string().datetime().optional(),
    }),
    emergencyPaused: z.boolean().default(false),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .superRefine((s, ctx) => {
    const eligible = new Set(s.eligibleAssets.map((a) => `${a.chainId}:${a.address}`));
    let sum = new D(s.cashPct);
    for (const t of s.targetAllocations) {
      const key = `${t.asset.chainId}:${t.asset.address}`;
      if (!eligible.has(key)) {
        ctx.addIssue({ code: "custom", message: `allocation asset ${t.asset.symbol} is not eligible`, path: ["targetAllocations"] });
      }
      if (t.asset.chainId !== s.chainId) {
        ctx.addIssue({ code: "custom", message: `asset ${t.asset.symbol} is on another chain`, path: ["targetAllocations"] });
      }
      if (new D(t.weightPct).gt(s.risk.maxAllocationPct)) {
        ctx.addIssue({ code: "custom", message: `${t.asset.symbol} target ${t.weightPct}% exceeds max allocation ${s.risk.maxAllocationPct}%`, path: ["targetAllocations"] });
      }
      sum = sum.plus(t.weightPct);
    }
    if (!sum.eq(100)) {
      ctx.addIssue({ code: "custom", message: `allocations plus cash must sum to 100 (got ${sum.toString()})`, path: ["targetAllocations"] });
    }
    if (new D(s.risk.maxTradeUsd).gt(s.risk.maxDailyUsd)) {
      ctx.addIssue({ code: "custom", message: "maxTradeUsd cannot exceed maxDailyUsd", path: ["risk", "maxTradeUsd"] });
    }
    if (s.executionMode === "automated" && s.authorization.status !== "granted") {
      ctx.addIssue({ code: "custom", message: "automated mode requires a granted authorization", path: ["authorization"] });
    }
  });

export type StrategySpec = z.infer<typeof strategySpecSchema>;
export type StrategySpecInput = z.input<typeof strategySpecSchema>;

/** Deterministic canonical JSON (sorted keys) for hashing a spec version. */
export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalize(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
