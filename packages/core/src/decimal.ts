import Decimal from "decimal.js";

/**
 * All financial arithmetic goes through decimal.js (spec §6.2: no float math).
 * A dedicated clone keeps the global Decimal untouched.
 */
export const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_EVEN, toExpNeg: -30, toExpPos: 40 });
export type Dec = InstanceType<typeof D>;

export const ZERO = new D(0);
export const ONE = new D(1);
export const HUNDRED = new D(100);
export const BPS = new D(10_000);

export function dec(v: Dec | string | number | bigint): Dec {
  return v instanceof D ? v : new D(typeof v === "bigint" ? v.toString() : v);
}

/** Convert raw token units (bigint) to a decimal amount using the token's decimals. */
export function fromUnits(units: bigint, decimals: number): Dec {
  return new D(units.toString()).div(new D(10).pow(decimals));
}

/** Convert a decimal amount to raw token units, rounding DOWN so we never overspend. */
export function toUnits(amount: Dec | string | number, decimals: number): bigint {
  const scaled = dec(amount).mul(new D(10).pow(decimals)).toDecimalPlaces(0, Decimal.ROUND_DOWN);
  return BigInt(scaled.toFixed(0));
}

export function bpsOf(amount: Dec | string | number, bps: number | string): Dec {
  return dec(amount).mul(dec(bps)).div(BPS);
}

/** Apply a slippage tolerance (bps) to an expected output to get the minimum acceptable. */
export function applySlippage(expected: Dec | string | number, slippageBps: number): Dec {
  return dec(expected).mul(BPS.minus(slippageBps)).div(BPS);
}

/** Percentage-point difference between two weights (0..100). Drift is measured in points. */
export function driftPoints(current: Dec | string | number, target: Dec | string | number): Dec {
  return dec(current).minus(dec(target)).abs();
}

const MINUS = "−";

/** $24,813.42 / −$12.40 — thousands separators, two decimals, true minus. */
export function formatUsd(v: Dec | string | number | bigint, opts: { sign?: boolean } = {}): string {
  const d = dec(v);
  const abs = d.abs().toFixed(2);
  const [int, frac] = abs.split(".");
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sign = d.isNegative() ? MINUS : opts.sign && d.gt(0) ? "+" : "";
  return `${sign}$${grouped}.${frac}`;
}

/** +2.6% / −1.8% / 0.0% with a true minus. */
export function formatPercent(v: Dec | string | number, digits = 1): string {
  const d = dec(v);
  if (d.isZero()) return `0.${"0".repeat(digits)}%`;
  return `${d.gt(0) ? "+" : MINUS}${d.abs().toFixed(digits)}%`;
}

/** 2.7412 mAAPL — amount to the asset's display precision, symbol after. */
export function formatTokenAmount(v: Dec | string | number | bigint, symbol: string, precision = 4): string {
  const d = dec(v);
  const abs = d.abs().toFixed(precision);
  const [int, frac] = abs.split(".");
  const grouped = int!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${d.isNegative() ? MINUS : ""}${grouped}${frac ? "." + frac : ""} ${symbol}`;
}

/** "5 pt" for allocation drift. */
export function formatPoints(v: Dec | string | number, digits = 0): string {
  return `${dec(v).toFixed(digits)} pt`;
}
