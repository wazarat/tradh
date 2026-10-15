"use client";

import { useQuery } from "@tanstack/react-query";
import { explorerTxUrl } from "@tradh/chain";
import { D, type TxState } from "@tradh/core";
import { TxStatus } from "@/components/td";
import { EmptyState } from "@/components/shell/page";
import { WalletGate } from "@/components/shell/wallet-gate";

interface Item { id: string; state: TxState; createdAt: string; sell: string; buy: string; amountIn: string; amountOut: string; lpFee: string | null; txHash: string | null; gasUsed: string | null; effectiveGasPrice: string | null }

export function ActivityPage() {
  return (
    <WalletGate session>
      <ActivityBody />
    </WalletGate>
  );
}

function ActivityBody() {
  const q = useQuery({ queryKey: ["activity"], queryFn: async () => { const r = await fetch("/api/activity"); if (!r.ok) throw new Error(`HTTP ${r.status}`); return (await r.json()) as { items: Item[] }; }, refetchInterval: 20_000 });
  if (q.isLoading) return <div className="td-list"><div className="td-empty"><span className="td-skel" style={{ width: 240 }} /></div></div>;
  if (q.error) return <EmptyState text="Activity is unavailable right now." />;
  if (!q.data?.items.length) return <EmptyState text="No activity yet." />;
  return (
    <div className="td-list">
      <table className="td-table">
        <thead><tr><th>When</th><th>Trade</th><th className="num">Sold</th><th className="num">Received</th><th className="num">Trading fee</th><th className="num">Gas</th><th>Status</th><th>Receipt</th></tr></thead>
        <tbody>
          {q.data.items.map((it) => {
            const gasEth = it.gasUsed && it.effectiveGasPrice ? new D(it.gasUsed).mul(it.effectiveGasPrice).div(new D(10).pow(18)).toFixed(6) : "—";
            return (
              <tr key={it.id}>
                <td>{new Date(it.createdAt).toLocaleString()}</td>
                <td>{it.sell} → {it.buy}</td>
                <td className="num">{new D(it.amountIn).toFixed(4)} {it.sell}</td>
                <td className="num">{new D(it.amountOut).toFixed(4)} {it.buy}</td>
                <td className="num">{it.lpFee ? `${new D(it.lpFee).toFixed(4)} ${it.sell}` : "—"}</td>
                <td className="num">{gasEth} ETH</td>
                <td><TxStatus state={it.state} /></td>
                <td>{it.txHash ? <a href={explorerTxUrl(it.txHash)} target="_blank" rel="noreferrer">Explorer</a> : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
