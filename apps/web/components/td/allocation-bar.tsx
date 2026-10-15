export interface AllocationItem {
  label: string;
  /** Percent 0..100 */
  value: number;
}

/** Stacked bar of weights in the espresso ramp; remainder is Cash. Max three holdings. */
export function AllocationBar({ items }: { items: AllocationItem[] }) {
  const used = items.reduce((a, b) => a + b.value, 0);
  const cash = Math.max(0, 100 - used);
  return (
    <div className="td-alloc">
      <div
        className="td-alloc-bar"
        role="img"
        aria-label={items.map((i) => `${i.label} ${i.value}%`).join(", ") + (cash > 0 ? `, cash ${cash}%` : "")}
      >
        {items.map((it, i) => (
          <span key={i} className={`td-alloc-seg td-alloc-${i + 1}`} style={{ width: `${it.value}%` }} />
        ))}
      </div>
      <div className="td-alloc-legend">
        {items.map((it, i) => (
          <span key={i} className="td-alloc-key">
            <span className={`td-alloc-sw td-alloc-${i + 1}`} />
            {it.label}
            <b>{it.value}%</b>
          </span>
        ))}
        {cash > 0 ? (
          <span className="td-alloc-key">
            <span className="td-alloc-sw td-alloc-cash" />
            Cash
            <b>{cash}%</b>
          </span>
        ) : null}
      </div>
    </div>
  );
}
