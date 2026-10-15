import type { ProvenanceKind } from "@tradh/core";
import { MarketChange } from "./market-change";
import { ProvenanceTag } from "./provenance-tag";
import { sparkPath } from "./market-state";

export interface PortfolioCardProps {
  value: string;
  change: number | string;
  changeAbs: string;
  points?: number[];
  provenance: ProvenanceKind;
  label?: string;
  range?: string;
  ranges?: string[];
  onRange?: (r: string) => void;
}

/** Headline value, change, single-series chart coloured by the sign of the change, range tabs. */
export function PortfolioCard({ value, change, changeAbs, points = [], provenance, label = "Portfolio value", range = "1W", ranges = ["1D", "1W", "1M", "3M", "1Y", "All"], onRange }: PortfolioCardProps) {
  const W = 320;
  const H = 84;
  const d = points.length > 1 ? sparkPath(points, W, H) : "";
  const n = Number(change);
  const dir = n > 0 ? "up" : n < 0 ? "down" : "flat";
  const stroke = dir === "up" ? "var(--positive)" : dir === "down" ? "var(--negative)" : "var(--ink-muted)";
  const fill = dir === "up" ? "var(--positive-soft)" : dir === "down" ? "var(--negative-soft)" : "var(--surface-muted)";
  return (
    <section className="td-card td-portfolio">
      <div className="td-portfolio-top">
        <span className="td-muted td-label">{label}</span>
        <span className="td-row-gap">
          <ProvenanceTag kind={provenance} />
          <MarketChange value={change} chip />
        </span>
      </div>
      <div className="td-figure">{value}</div>
      <div className="td-portfolio-delta">
        <MarketChange value={change} />
        <span className={`td-change-${dir}`}>{changeAbs}</span>
      </div>
      {d ? (
        <svg className="td-portfolio-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          <path d={`${d}L${W} ${H}L0 ${H}Z`} style={{ fill }} />
          <path d={d} style={{ fill: "none", stroke, strokeWidth: 1.75, vectorEffect: "non-scaling-stroke" }} />
        </svg>
      ) : (
        <div className="td-skel" style={{ height: 84, marginTop: 8 }} />
      )}
      <div className="td-tabs" role="tablist">
        {ranges.map((r) => (
          <button key={r} type="button" role="tab" aria-selected={r === range} className={["td-tab", r === range && "td-tab-on"].filter(Boolean).join(" ")} onClick={() => onRange?.(r)}>
            {r}
          </button>
        ))}
      </div>
    </section>
  );
}
