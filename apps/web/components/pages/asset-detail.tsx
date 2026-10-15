"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { explorerAddressUrl } from "@tradh/chain";
import { formatTokenAmount, formatUsd } from "@tradh/core";
import { Badge, MarketState } from "@/components/td";
import { EmptyState, PageHead } from "@/components/shell/page";
import { poolPrice, useAssets, useBalances, useOraclePrices, useReserves } from "@/lib/chain/hooks";
import { TradeTicket } from "@/components/trade/trade-ticket";

export function AssetDetailPage({ symbol }: { symbol: string }) {
  const { tradable, quote } = useAssets();
  const asset = tradable.find((a) => a.symbol.toLowerCase() === symbol.toLowerCase());
  const { byAddress: prices } = useOraclePrices();
  const { byAddress: balances } = useBalances();
  const { isConnected } = useAccount();
  const reserves = useReserves(asset);

  if (!asset || !quote) {
    return (
      <>
        <PageHead title={symbol} />
        <EmptyState text="Unknown or undeployed asset." action={<Link href="/markets" className="td-note">Back to markets</Link>} />
      </>
    );
  }
  const p = prices.get(asset.address);
  const pool = poolPrice(reserves.data as readonly [bigint, bigint] | undefined, asset, quote);
  const bal = balances.get(asset.address);

  return (
    <>
      <PageHead eyebrow={`Mock · underlying reference ${asset.underlyingSymbol ?? ""}`} title={`${asset.symbol} · ${asset.name}`}>
        <div className="td-row-gap"><Badge tone="brand">Mock asset</Badge><Badge tone="brand">Testnet</Badge></div>
      </PageHead>
      <div className="td-grid">
        <div className="td-col-4 td-stack">
          <MarketState state={p?.valid ? "neutral" : "pending"} label="Oracle price" value={p?.valid && p.price ? formatUsd(p.price) : "—"} caption={p?.valid ? `Updated ${p.ageSeconds && p.ageSeconds > 60 ? `${Math.floor(p.ageSeconds / 60)} min` : "under a minute"} ago` : "Stale or missing; trading blocked"} />
        </div>
        <div className="td-col-4 td-stack">
          <MarketState state="neutral" label="Pool price" value={pool ? formatUsd(pool) : "—"} caption={reserves.data ? `Liquidity ${formatUsd(Number((reserves.data as readonly [bigint, bigint])[1]) / 1e6)} ${quote.symbol}` : "No pool"} />
        </div>
        <div className="td-col-4 td-stack">
          <MarketState state="neutral" label="Your balance" value={isConnected && bal ? formatTokenAmount(bal.amount, asset.symbol, asset.displayPrecision) : "—"} caption={isConnected ? (p?.valid && p.price && bal ? formatUsd(bal.amount.mul(p.price)) : "") : "Connect a wallet"} />
        </div>
        <div className="td-col-12 td-stack">
          <section className="td-card td-stack" style={{ gap: "var(--space-2)" }}>
            <div className="td-eyebrow">About this asset</div>
            <p className="td-note" style={{ color: "var(--ink)" }}>
              {asset.name} ({asset.symbol}) is a testnet simulation of economic exposure to {asset.underlyingSymbol}. It has no monetary value, is not issued by Robinhood or any issuer, and exists so the platform can be exercised end to end. Token contract:{" "}
              <a href={explorerAddressUrl(asset.address)} target="_blank" rel="noreferrer" style={{ fontVariantNumeric: "tabular-nums" }}>{asset.address}</a>.
            </p>
          </section>
        </div>
        <div className="td-col-12">
          <h2 className="t-h2" style={{ marginBottom: "var(--space-4)" }}>Trade {asset.symbol}</h2>
          <TradeTicket initialSymbol={asset.symbol} />
        </div>
      </div>
    </>
  );
}
