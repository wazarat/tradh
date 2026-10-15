import { formatPercent } from "@tradh/core";

export interface MarketChangeProps {
  /** Percent, e.g. 4.2 or -1.8 (string or number; computed upstream with decimals). */
  value: number | string;
  digits?: number;
  chip?: boolean;
}

/** Signed percentage change. Sign and triangle carry the meaning; colour is secondary. */
export function MarketChange({ value, digits = 1, chip }: MarketChangeProps) {
  const n = Number(value);
  const dir = n > 0 ? "up" : n < 0 ? "down" : "flat";
  return (
    <span className={["td-change", `td-change-${dir}`, chip && "td-change-chip"].filter(Boolean).join(" ")}>
      {chip ? (
        <span className="td-tri" aria-hidden>
          {dir === "up" ? "▲" : dir === "down" ? "▼" : "–"}
        </span>
      ) : null}
      {formatPercent(value, digits)}
    </span>
  );
}
