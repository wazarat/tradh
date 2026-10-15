import type { ProvenanceKind } from "@tradh/core";

const PROV: Record<ProvenanceKind, { label: string; note: string }> = {
  simulated: { label: "Simulated", note: "Mock price scenario, not a historical backtest" },
  backtested: { label: "Backtested", note: "Historical simulation using underlying-market data" },
  forward: { label: "Forward-tested", note: "Recorded after publication, simulated trading" },
  live: { label: "Live verified", note: "Confirmed onchain executions" },
};

/** Required on every performance figure. Never merge kinds in one series. */
export function ProvenanceTag({ kind }: { kind: ProvenanceKind }) {
  return (
    <span className={`td-prov td-prov-${kind}`} title={PROV[kind].note}>
      {PROV[kind].label}
    </span>
  );
}
