"use client";

import { useAccount, useDisconnect } from "wagmi";
import { FAUCET_URL, robinhoodTestnet } from "@tradh/chain";
import { Badge, Button, Rows } from "@/components/td";
import { Section } from "@/components/shell/page";
import { WalletGate } from "@/components/shell/wallet-gate";
import { useTheme } from "@/components/shell/theme";
import { useSession } from "@/lib/auth/use-session";

export function SettingsPage() {
  const { address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { theme, setTheme } = useTheme();
  const { me, signOut } = useSession();
  return (
    <WalletGate session>
      <div className="td-grid">
        <div className="td-col-6 td-stack" style={{ gap: "var(--space-8)" }}>
          <Section title="Wallet">
            <section className="td-card td-stack">
              <Rows rows={[{ label: "Address", value: address ?? "—" }, { label: "Connector", value: connector?.name ?? "—" }, { label: "Session expires", value: me?.expiresAt ? new Date(me.expiresAt).toLocaleString() : "—" }]} />
              <div className="td-row-gap">
                <Button variant="secondary" size="sm" onClick={async () => { await signOut.mutateAsync().catch(() => {}); disconnect(); }}>Sign out and disconnect</Button>
              </div>
            </section>
          </Section>
          <Section title="Network">
            <section className="td-card td-stack">
              <Rows rows={[{ label: "Network", value: robinhoodTestnet.name }, { label: "Chain ID", value: String(robinhoodTestnet.id) }, { label: "RPC", value: robinhoodTestnet.rpcUrls.default.http[0]! }, { label: "Explorer", value: robinhoodTestnet.blockExplorers.default.url }, { label: "Live money", value: "Disabled" }]} />
              <p className="td-note">Mainnet (chain 4663) stays disabled until a separate approval. Testnet ETH for gas: <a href={FAUCET_URL} target="_blank" rel="noreferrer">faucet</a>.</p>
            </section>
          </Section>
        </div>
        <div className="td-col-6 td-stack" style={{ gap: "var(--space-8)" }}>
          <Section title="Appearance">
            <section className="td-card td-stack">
              <div className="td-seg" role="group" aria-label="Theme">
                {(["system", "light", "dark"] as const).map((t) => (
                  <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>{t[0]!.toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
            </section>
          </Section>
          <Section title="Trading defaults">
            <section className="td-card td-stack">
              <Rows rows={[{ label: "Default slippage", value: "0.50%" }, { label: "Quote validity", value: "30 s" }, { label: "Max price age", value: "60 min" }]} />
              <p className="td-note">Editable defaults, notification preferences and strategy authorizations arrive with Milestones 3–4.</p>
            </section>
          </Section>
          <Section title="Account">
            <section className="td-card td-stack">
              <div className="td-row-gap"><Badge tone="neutral">Planned</Badge><span className="td-note">Data export and account deletion.</span></div>
            </section>
          </Section>
        </div>
      </div>
    </WalletGate>
  );
}
