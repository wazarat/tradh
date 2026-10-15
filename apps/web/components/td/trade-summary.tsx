import type { ReactNode } from "react";
import { Badge } from "./badge";
import { Rows, type Row } from "./rows";

export interface TradeSummaryProps {
  rows: Row[];
  expiresIn?: string;
  note?: string;
  title?: string;
  /** The single primary action (Confirm in wallet / Refresh quote). */
  action: ReactNode;
}

/** Pre-submission review listing every cost before the wallet prompt. */
export function TradeSummary({ rows, expiresIn, note, title = "Review trade", action }: TradeSummaryProps) {
  return (
    <section className="td-card td-ticket">
      <div className="td-ticket-top">
        <h3 className="td-h3">{title}</h3>
        {expiresIn ? (
          <Badge tone="neutral" icon="clock">
            Quote expires in {expiresIn}
          </Badge>
        ) : null}
      </div>
      <Rows rows={rows} />
      {note ? <p className="td-ticket-note">{note}</p> : null}
      {action}
    </section>
  );
}
