export interface Row {
  label: string;
  value: string;
  strong?: boolean;
}

/** Definition rows (costs, limits). Values are tabular. */
export function Rows({ rows }: { rows: Row[] }) {
  return (
    <dl className="td-rows">
      {rows.map((r, i) => (
        <div key={i} className={["td-rows-r", r.strong && "td-rows-strong"].filter(Boolean).join(" ")}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
