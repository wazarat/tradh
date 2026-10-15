"use client";

import { useMemo } from "react";
import { erc20Abi, formatUnits, type Address } from "viem";
import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { MockPriceOracleAbi, MockSpotExchangeAbi, getDeployment, listAssets, robinhoodTestnet, type Asset } from "@tradh/chain";
import { D, fromUnits, type Dec } from "@tradh/core";

export const CHAIN_ID = robinhoodTestnet.id;
export const MAX_PRICE_AGE_SECONDS = 3600;

export function useDeployment() {
  return useMemo(() => getDeployment(CHAIN_ID), []);
}

export function useAssets(): { assets: Asset[]; quote: Asset | undefined; tradable: Asset[]; deployed: boolean } {
  return useMemo(() => {
    const assets = listAssets(CHAIN_ID);
    return { assets, quote: assets.find((a) => a.isQuote), tradable: assets.filter((a) => !a.isQuote), deployed: assets.length > 0 };
  }, []);
}

export interface OraclePrice {
  asset: Asset;
  /** USD decimal, or undefined when the feed is invalid/missing. */
  price?: Dec;
  updatedAt?: number;
  valid: boolean;
  ageSeconds?: number;
}

/** Reads MockPriceOracle.peekPrice for every tradable asset (non-reverting). */
export function useOraclePrices(refetchInterval = 15_000) {
  const dep = useDeployment();
  const { tradable } = useAssets();
  const oracle = dep?.contracts.MockPriceOracle?.address;
  const q = useReadContracts({
    contracts: tradable.map((a) => ({ address: oracle as Address, abi: MockPriceOracleAbi, functionName: "peekPrice", args: [a.address] as const, chainId: CHAIN_ID })),
    query: { enabled: Boolean(oracle) && tradable.length > 0, refetchInterval },
  });
  // Age is measured against the time the query data was fetched (stable per render), not Date.now().
  const now = Math.floor((q.dataUpdatedAt || 0) / 1000);
  const prices: OraclePrice[] = tradable.map((asset, i) => {
    const r = q.data?.[i];
    if (!r || r.status !== "success") return { asset, valid: false };
    const [price, updatedAt, valid] = r.result as unknown as readonly [bigint, bigint, boolean];
    return { asset, price: fromUnits(price, 8), updatedAt: Number(updatedAt), valid, ageSeconds: Math.max(0, now - Number(updatedAt)) };
  });
  return { ...q, prices, byAddress: new Map(prices.map((p) => [p.asset.address, p])) };
}

export interface Balance {
  asset: Asset;
  units: bigint;
  amount: Dec;
}

/** ERC-20 balances of the connected wallet for every registered asset. */
export function useBalances(refetchInterval = 15_000) {
  const { address } = useAccount();
  const { assets } = useAssets();
  const q = useReadContracts({
    contracts: assets.map((a) => ({ address: a.address, abi: erc20Abi, functionName: "balanceOf", args: [address as Address] as const, chainId: CHAIN_ID })),
    query: { enabled: Boolean(address) && assets.length > 0, refetchInterval },
  });
  const balances: Balance[] = assets.map((asset, i) => {
    const r = q.data?.[i];
    const units = r?.status === "success" ? (r.result as bigint) : 0n;
    return { asset, units, amount: fromUnits(units, asset.decimals) };
  });
  return { ...q, balances, byAddress: new Map(balances.map((b) => [b.asset.address, b])) };
}

export function useReserves(asset: Asset | undefined) {
  const dep = useDeployment();
  const dex = dep?.contracts.MockSpotExchange?.address;
  return useReadContract({
    address: dex as Address,
    abi: MockSpotExchangeAbi,
    functionName: "getReserves",
    args: asset ? [asset.address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(dex && asset), refetchInterval: 15_000 },
  });
}

export function useExchangeFees() {
  const dep = useDeployment();
  const dex = dep?.contracts.MockSpotExchange?.address;
  return useReadContract({ address: dex as Address, abi: MockSpotExchangeAbi, functionName: "lpFeeBps", chainId: CHAIN_ID, query: { enabled: Boolean(dex), staleTime: 60_000 } });
}

/** Pool-implied price of an asset in mUSD (reserveQuote / reserveAsset), decimals-adjusted. */
export function poolPrice(reserves: readonly [bigint, bigint] | undefined, asset: Asset, quote: Asset): Dec | undefined {
  if (!reserves) return undefined;
  const [rA, rQ] = reserves;
  if (rA === 0n) return undefined;
  return new D(formatUnits(rQ, quote.decimals)).div(new D(formatUnits(rA, asset.decimals)));
}
