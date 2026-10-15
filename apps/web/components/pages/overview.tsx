"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { D, formatUsd, formatTokenAmount } from "@tradh/core";
import { AssetRow, Badge, Button, ProvenanceTag } from "@/components/td";
import { EmptyState, Section } from "@/components/shell/page";
import { WalletGate } from "@/components/shell/wallet-gate";
import { FaucetPanel } from "@/components/trade/faucet";
import { useAssets, useBalances, useOraclePrices } from "@/lib/chain/hooks";
import { useSession } from "@/lib/auth/use-session";

export function OverviewPage() {
  return (
    <WalletGate>
      <OverviewBody />
    </WalletGate>
  );
}

function OverviewBody() {
  const { address } = useAccount();
  const { quote, tradable, deployed } = useAssets();
  const { balances, isLoading: balLoading } = useBalances();
  const { byAddress: prices } = useOraclePrices();
  const { authenticated } = useSession();
  const activity = useQuery({ queryKey: ["activity"], enabled: authenticated, queryFn: () => fetch("/api/activity").then((r) => (r.ok ? r.json() : { items: [] })) as Promise<{ items: { id: string; state: string; sell: string; buy: string; amountIn: string; amountOut: string; createdAt: string }[] }> });

  if (!deployed) return <EmptyState text="Mock assets are not deployed on this network yet. Deployment is the next milestone step." />;

  const cash = balances.find((b) => b.asset.isQuote);
  let total = cash?.amount ?? new D(0);
  let allPriced = true;
  for (const b of balances) {
    if (b.asset.isQuote) continue;
    const p = prices.get(b.asset.address);
    if (!p?.valid || !p.price) {
      if (b.units > 0n) allPriced = false;
      continue;
    }
    total = total.plus(b.amount.mul(p.price));
  }

  return (
    <div className="td-grid">
      <div className="td-col-8 td-stack" style={{ gap: "var(--space-8)" }}>
        <section className="td-card td-stack" style={{ gap: "var(--space-2)" }}>
          <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
            <span className="td-muted td-label">Testnet portfolio value</span>
            <span className="td-row-gap"><ProvenanceTag kind="live" /><Badge tone="brand">Testnet</Badge></span>
          </div>
          {balLoading ? <div className="td-skel" style={{ height: 36, width: 220 }} /> : <div className="td-figure">{formatUsd(total)}</div>}
          <p className="td-note">
            Wallet balances valued at the mock oracle price{allPriced ? "" : " (some positions have a pending price and are excluded)"}. Available mock USD: {cash ? formatUsd(cash.amount) : "—"}.
          </p>
        </section>
        <Section title="Holdings">
          <div className="td-list">
            {tradable.map((a) => {
              const b = balances.find((x) => x.asset.address === a.address);
              const p = prices.get(a.address);
              return (
                <AssetRow key={a.address} symbol={a.symbol} name={a.name} mock href={`/markets/${a.symbol}`} price={b ? formatTokenAmount(b.amount, a.symbol, a.displayPrecision) : "—"} caption={p?.valid && p.price && b ? `${formatUsd(b.amount.mul(p.price))} at ${formatUsd(p.price)}` : "Price pending"} />
              );
            })}
          </div>
        </Section>
        <Section title="Recent executions" actions={<Link href="/activity" className="td-note">All activity</Link>}>
          {!authenticated ? (
            <EmptyState text="Sign in to see executions recorded for this wallet." />
          ) : activity.data?.items.length ? (
            <div className="td-list">
              <table className="td-table">
                <thead><tr><th>When</th><th>Trade</th><th className="num">Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {activity.data.items.slice(0, 5).map((it) => (
                    <tr key={it.id}>
                      <td>{new Date(it.createdAt).toLocaleString()}</td>
                      <td>{it.sell} → {it.buy}</td>
                      <td className="num">{new D(it.amountIn).toFixed(4)} {it.sell}</td>
                      <td><Badge tone={it.state === "confirmed" ? "positive" : it.state === "failed" ? "negative" : "neutral"}>{it.state}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="No executions yet." action={<Link href="/trade" className="td-btn td-btn-secondary td-btn-sm">Trade</Link>} />
          )}
        </Section>
        <Section title="Strategies">
          <EmptyState text="No strategies yet. Strategy creation arrives in Milestone 3." action={<Button size="sm" disabled title="Available in Milestone 3">Create strategy</Button>} />
        </Section>
      </div>
      <div className="td-col-4 td-stack" style={{ gap: "var(--space-8)" }}>
        <FaucetPanel />
        <section className="td-card td-stack" style={{ gap: "var(--space-2)" }}>
          <div className="td-eyebrow">Wallet</div>
          <span className="td-label" style={{ wordBreak: "break-all" }}>{address}</span>
          <span className="td-note">Robinhood Chain Testnet · chain 46630 · {quote?.symbol ?? "mUSD"} settlement</span>
        </section>
      </div>
    </div>
  );
}
