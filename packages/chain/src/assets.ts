import { getDeployment } from "./deployments";

/**
 * Asset registry. Identity is (chainId, address) — never a bare ticker (spec §3).
 * Mock assets come from the deployment manifest; issuer-backed assets are only listed when
 * a verified deployment exists on the active chain (none on 46630 as of 2026-10-15).
 */
export interface Asset {
  id: string; // `${chainId}:${address}`
  chainId: number;
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  kind: "mock" | "issuer";
  underlyingSymbol: string | null;
  isQuote: boolean;
  /** Display precision for token amounts. */
  displayPrecision: number;
}

export function assetId(chainId: number, address: string): string {
  return `${chainId}:${address.toLowerCase()}`;
}

export function listAssets(chainId: number): Asset[] {
  const m = getDeployment(chainId);
  if (!m || !m.deployed) return [];
  return m.assets.map((a) => ({
    id: assetId(chainId, a.address),
    chainId,
    address: a.address.toLowerCase() as `0x${string}`,
    symbol: a.symbol,
    name: a.name,
    decimals: a.decimals,
    kind: a.kind,
    underlyingSymbol: a.underlyingSymbol,
    isQuote: a.isQuote,
    displayPrecision: a.isQuote ? 2 : 4,
  }));
}

export function listTradableAssets(chainId: number): Asset[] {
  return listAssets(chainId).filter((a) => !a.isQuote);
}

export function getQuoteAsset(chainId: number): Asset | undefined {
  return listAssets(chainId).find((a) => a.isQuote);
}

export function findAsset(chainId: number, addressOrSymbol: string): Asset | undefined {
  const needle = addressOrSymbol.toLowerCase();
  return listAssets(chainId).find((a) => a.address === needle || a.symbol.toLowerCase() === needle);
}
