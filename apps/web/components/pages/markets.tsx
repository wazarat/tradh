"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatUsd } from "@tradh/core";
import { Badge, TextField } from "@/components/td";
import { EmptyState } from "@/components/shell/page";
import { useAssets, useOraclePrices } from "@/lib/chain/hooks";

export function MarketsPage() {
  const { tradable, deployed } = useAssets();
  const { byAddress: prices, isLoading } = useOraclePrices();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"symbol" | "price">("symbol");

  const rows = useMemo(() => {
    const filtered = tradable.filter((a) => `${a.symbol} ${a.name} ${a.underlyingSymbol ?? ""}`.toLowerCase().includes(q.toLowerCase()));
    return filtered.sort((a, b) => {
      if (sort === "symbol") return a.symbol.localeCompare(b.symbol);
      const pa = prices.get(a.address)?.price?.toNumber() ?? -1;
      const pb = prices.get(b.address)?.price?.toNumber() ?? -1;
      return pb - pa;
    });
  }, [tradable, q, sort, prices]);

  if (!deployed) return <EmptyState text="Mock assets are not deployed on this network yet." />;

  return (
    <div className="td-stack" style={{ gap: "var(--space-6)" }}>
      <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
        <TextField icon="search" placeholder="Search assets" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search assets" />
        <div className="td-seg" role="group" aria-label="Sort">
          <button type="button" aria-pressed={sort === "symbol"} onClick={() => setSort("symbol")}>Ticker</button>
          <button type="button" aria-pressed={sort === "price"} onClick={() => setSort("price")}>Price</button>
        </div>
      </div>
      <div className="td-list">
        <table className="td-table">
          <thead>
            <tr><th>Asset</th><th>Status</th><th className="num">Reference price</th><th>Data</th><th>Venue</th><th>Contract</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const p = prices.get(a.address);
              const age = p?.ageSeconds ?? 0;
              return (
                <tr key={a.address}>
                  <td>
                    <Link href={`/markets/${a.symbol}`} className="td-rowlink td-row-gap">
                      <b>{a.symbol}</b> <span className="td-muted">{a.name}</span> <Badge tone="brand">Mock</Badge>
                    </Link>
                  </td>
                  <td>{p?.valid ? <Badge tone="positive" icon="check">Tradable</Badge> : <Badge tone="neutral" icon="clock">Pending</Badge>}</td>
                  <td className="num">{isLoading ? <span className="td-skel" style={{ display: "inline-block", width: 80 }} /> : p?.valid && p.price ? formatUsd(p.price) : "—"}</td>
                  <td className="td-muted">{p?.valid ? (age > 60 ? `Updated ${Math.floor(age / 60)} min ago` : "Fresh") : "Stale or missing"}</td>
                  <td className="td-muted">Mock spot exchange</td>
                  <td className="td-muted" style={{ fontVariantNumeric: "tabular-nums" }}>{a.address.slice(0, 6)}…{a.address.slice(-4)}</td>
                </tr>
              );
            })}
            {rows.length === 0 ? <tr><td colSpan={6} className="td-muted">No assets match.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <p className="td-note">Mock assets are simulations with no monetary value and are not Robinhood-issued Stock Tokens. Reference prices come from the testnet mock oracle; executable prices come from pool quotes.</p>
    </div>
  );
}
