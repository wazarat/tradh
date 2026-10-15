import type { ReactNode } from "react";

export function PageHead({ eyebrow, title, actions, children }: { eyebrow?: string; title: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="td-page-head">
      <div className="td-stack" style={{ gap: 4 }}>
        {eyebrow ? <div className="td-eyebrow">{eyebrow}</div> : null}
        <h1 className="t-h1">{title}</h1>
        {children}
      </div>
      {actions ? <div className="td-row-gap">{actions}</div> : null}
    </div>
  );
}

export function Section({ title, actions, children }: { title?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="td-section">
      {title || actions ? (
        <div className="td-section-head">
          {title ? <h2 className="t-h3">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function EmptyState({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="td-list">
      <div className="td-empty">
        <span>{text}</span>
        {action}
      </div>
    </div>
  );
}

export function TestnetNote() {
  return <p className="td-note">Testnet transaction with mock assets. No real value is exchanged.</p>;
}
