import Link from "next/link";
import { Badge } from "@/components/td";

const ROADMAP = [
  { tier: "Launch", status: "In development", title: "Build and Trade", body: "Create investment strategies with AI, explore supported markets, and manage trades manually or through controlled automation." },
  { tier: "Next", status: "Planned", title: "Test and Optimize", body: "Run historical backtests, stress-test investment strategies, optimize risk controls, and access expanded trading infrastructure." },
  { tier: "Later", status: "Planned", title: "Verify and Discover", body: "Introduce ERC-8004 agent identities, verifiable strategy track records, reputation systems, and the ability to discover and follow other strategies." },
] as const;

export default function Landing() {
  return (
    <div className="td-shell" data-theme="light" style={{ colorScheme: "light" }}>
      <header className="td-header">
        <Link href="/" className="td-header-logo" aria-label="tradh. home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="td-logo-light" src="/brand/tradh-wordmark-espresso.svg" alt="tradh." height={26} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="td-logo-dark" src="/brand/tradh-wordmark-porcelain.svg" alt="" height={26} />
        </Link>
        <div className="td-header-end">
          <Badge tone="brand" dot>Robinhood Chain Testnet</Badge>
          <Link href="/overview" className="td-btn td-btn-primary td-btn-sm">Open app</Link>
        </div>
      </header>
      <main className="td-main">
        <div className="container-td td-stack" style={{ gap: "var(--space-16)" }}>
          <section className="td-stack" style={{ maxWidth: 640, gap: "var(--space-6)", paddingTop: "var(--space-12)" }}>
            <div className="td-eyebrow">Strategy trading on Robinhood Chain</div>
            <h1 className="t-display">Build, test and execute your own strategies.</h1>
            <p className="t-body-lg" style={{ color: "var(--ink-muted)", margin: 0 }}>
              Describe a strategy in plain English. Review the exact rules. Approve each trade, or authorize limited automation with risk limits you set and can revoke at any time.
            </p>
            <div className="td-row-gap">
              <Link href="/overview" className="td-btn td-btn-primary td-btn-lg">Get started</Link>
              <Link href="/markets" className="td-btn td-btn-secondary td-btn-lg">Explore markets</Link>
            </div>
            <p className="td-note">Testnet preview with mock assets. No real value is exchanged. Nothing here is investment advice.</p>
          </section>
          <section className="td-stack">
            <div className="td-eyebrow">Roadmap</div>
            <div className="td-grid">
              {ROADMAP.map((r) => (
                <section key={r.tier} className="td-card td-stack td-col-4" style={{ gap: "var(--space-3)" }}>
                  <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
                    <span className="td-eyebrow">{r.tier}</span>
                    <Badge tone={r.status === "In development" ? "brand" : "neutral"}>{r.status}</Badge>
                  </div>
                  <h3 className="td-h3">{r.title}</h3>
                  <p className="td-note" style={{ color: "var(--ink)" }}>{r.body}</p>
                </section>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
