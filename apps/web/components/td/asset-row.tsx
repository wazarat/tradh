import Link from "next/link";
import { Badge } from "./badge";
import { MarketChange } from "./market-change";

export interface AssetRowProps {
  symbol: string;
  name: string;
  price: string;
  change?: number | string;
  mock?: boolean;
  href?: string;
  caption?: string;
}

/** One asset in a list: ticker monogram (never company logos), name, price and change. */
export function AssetRow({ symbol, name, price, change, mock, href, caption }: AssetRowProps) {
  const body = (
    <>
      <span className="td-asset-mono" aria-hidden>
        {symbol.replace(/^m(?=[A-Z])/, "").slice(0, 1)}
      </span>
      <span className="td-asset-id">
        <span className="td-asset-sym">
          {symbol}
          {mock ? <Badge tone="brand">Mock</Badge> : null}
        </span>
        <span className="td-asset-name">{caption ?? name}</span>
      </span>
      <span className="td-asset-px">
        <span className="td-asset-price">{price}</span>
        {change !== undefined ? <MarketChange value={change} /> : <span className="td-muted td-label">—</span>}
      </span>
    </>
  );
  return href ? (
    <Link href={href} className="td-asset td-rowlink">
      {body}
    </Link>
  ) : (
    <div className="td-asset">{body}</div>
  );
}
