import { D, type Dec, dec, BPS, ZERO } from "./decimal";

/**
 * Pure-TS mirror of MockSpotExchange.quoteExactIn for previews and tests. The contract's
 * on-chain quote is always authoritative before signing; this exists so the UI can show
 * price impact / min received instantly and so the risk engine can reason about a trade
 * without an RPC round trip. Amounts are decimal (not raw units).
 */
export interface PoolState {
  reserveIn: Dec | string;
  reserveOut: Dec | string;
  lpFeeBps: number;
  protocolFeeBps: number;
}

export interface QuotePreview {
  amountOut: Dec;
  lpFee: Dec;
  protocolFee: Dec;
  spotPrice: Dec; // out per in, before the trade
  execPrice: Dec; // out per in, this trade
  priceImpactBps: Dec;
}

export function previewExactIn(pool: PoolState, amountIn: Dec | string | number): QuotePreview {
  const rIn = dec(pool.reserveIn);
  const rOut = dec(pool.reserveOut);
  const aIn = dec(amountIn);
  if (aIn.lte(0)) throw new RangeError("amountIn must be positive");
  if (rIn.lte(0) || rOut.lte(0)) throw new RangeError("pool has no liquidity");

  const lpFee = aIn.mul(pool.lpFeeBps).div(BPS);
  const protocolFee = aIn.mul(pool.protocolFeeBps).div(BPS);
  const netIn = aIn.minus(lpFee).minus(protocolFee);
  const amountOut = netIn.mul(rOut).div(rIn.plus(netIn));
  const spotPrice = rOut.div(rIn);
  const execPrice = amountOut.div(aIn);
  const priceImpactBps = spotPrice.gt(execPrice)
    ? spotPrice.minus(execPrice).div(spotPrice).mul(BPS)
    : ZERO;
  return { amountOut, lpFee, protocolFee, spotPrice, execPrice, priceImpactBps };
}

/** USD notional of a trade given a reference price (used by risk limits). */
export function notionalUsd(amount: Dec | string | number, priceUsd: Dec | string | number): Dec {
  return dec(amount).mul(dec(priceUsd));
}

export const Decimal = D;
