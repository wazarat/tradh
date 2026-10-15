import { Icon, type IconName } from "./icon";

export type MarketStateKind = "positive" | "negative" | "pending" | "neutral";
const STATE: Record<MarketStateKind, { icon: IconName; label: string }> = {
  positive: { icon: "arrow-up-right", label: "Positive" },
  negative: { icon: "arrow-down-right", label: "Negative" },
  pending: { icon: "clock", label: "Pending" },
  neutral: { icon: "minus", label: "Neutral" },
};

export function sparkPath(points: number[], w: number, h: number): string {
  if (points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points
    .map((v, i) => `${i ? "L" : "M"}${((i * w) / (points.length - 1)).toFixed(1)} ${(h - 2 - ((v - min) / span) * (h - 4)).toFixed(1)}`)
    .join("");
}

/** Compact tile. Pending means stale or missing data and blocks trading. */
export function MarketState({ state, value, caption, label, points }: { state: MarketStateKind; value: string; caption?: string; label?: string; points?: number[] }) {
  const s = STATE[state];
  return (
    <div className={`td-mstate td-mstate-${state}`}>
      <div className="td-mstate-head">
        <span className="td-mstate-ic">
          <Icon name={s.icon} size={14} />
        </span>
        {label ?? s.label}
      </div>
      <div className="td-mstate-val">{value}</div>
      {caption ? <div className="td-mstate-cap">{caption}</div> : null}
      {points && points.length > 1 ? (
        <svg className="td-mstate-spark" viewBox="0 0 64 24" aria-hidden>
          <path d={sparkPath(points, 64, 24)} />
        </svg>
      ) : null}
    </div>
  );
}
