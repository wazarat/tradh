"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { robinhoodTestnet } from "@tradh/chain";
import { Badge, Button, Icon } from "@/components/td";
import { useSession } from "@/lib/auth/use-session";
import { useTheme } from "./theme";

export const PRIMARY_NAV = [
  { label: "Overview", href: "/overview" },
  { label: "Markets", href: "/markets" },
  { label: "Trade", href: "/trade" },
  { label: "Strategies", href: "/strategies" },
  { label: "Activity", href: "/activity" },
] as const;

export function shortAddress(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function subscribeNoop() {
  return () => {};
}

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

/** The one top bar: wordmark, five destinations, network chip and wallet control. */
export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="td-header">
      <Link href="/overview" className="td-header-logo" aria-label="tradh. home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="td-logo-light" src="/brand/tradh-wordmark-espresso.svg" alt="tradh." height={26} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="td-logo-dark" src="/brand/tradh-wordmark-porcelain.svg" alt="" height={26} />
      </Link>
      <nav className="td-nav" aria-label="Primary">
        {PRIMARY_NAV.map((it) => {
          const on = pathname === it.href || pathname.startsWith(it.href + "/");
          return (
            <Link key={it.href} href={it.href} className={["td-nav-a", on && "td-nav-on"].filter(Boolean).join(" ")} aria-current={on ? "page" : undefined}>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="td-header-end">
        <NetworkChip />
        <WalletControl />
      </div>
    </header>
  );
}

function NetworkChip() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const wrong = isConnected && chainId !== robinhoodTestnet.id;
  if (wrong) {
    return (
      <button type="button" className="td-wallet" onClick={() => switchChain({ chainId: robinhoodTestnet.id })} disabled={isPending} title="Switch to Robinhood Chain Testnet">
        <Badge tone="negative" dot>
          Wrong network
        </Badge>
        <span>{isPending ? "Switching…" : "Switch"}</span>
      </button>
    );
  }
  return (
    <Badge tone="brand" dot>
      <span className="td-net-full">Robinhood Chain Testnet</span>
      <span className="td-net-short">Testnet</span>
    </Badge>
  );
}

function WalletControl() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending: connecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { authenticated, me, signIn, signOut } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  if (!mounted) {
    return (
      <button type="button" className="td-wallet" disabled>
        <Icon name="wallet" /> Connect wallet
      </button>
    );
  }

  if (!isConnected || !address) {
    return (
      <div ref={ref} style={{ position: "relative" }}>
        <button type="button" className="td-wallet" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
          <Icon name="wallet" /> {connecting ? "Connecting…" : "Connect wallet"}
        </button>
        {open ? (
          <div className="td-menu" role="menu">
            {connectors.map((c) => (
              <button key={c.uid} type="button" role="menuitem" onClick={() => { connect({ connector: c, chainId: robinhoodTestnet.id }); setOpen(false); }}>
                {c.name}
                <Icon name="arrow-right" />
              </button>
            ))}
            {connectors.length === 0 ? <span className="td-note" style={{ padding: 8 }}>No wallet found. Install a browser wallet such as MetaMask or Rabby.</span> : null}
            {connectError ? <span className="td-note" style={{ padding: 8, color: "var(--negative)" }}>{connectError.message.split("\n")[0]}</span> : null}
          </div>
        ) : null}
      </div>
    );
  }

  const onRightChain = chainId === robinhoodTestnet.id;
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {!authenticated && me?.databaseConfigured ? (
        <span className="td-row-gap">
          <Button size="sm" variant="primary" onClick={() => signIn.mutate()} disabled={signIn.isPending || !onRightChain} title={onRightChain ? "Sign a message to start a session" : "Switch network first"}>
            {signIn.isPending ? "Check your wallet…" : "Sign in"}
          </Button>
          <button type="button" className="td-wallet" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
            <Icon name="wallet" /> {shortAddress(address)}
          </button>
        </span>
      ) : (
        <button type="button" className="td-wallet" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
          <Icon name="wallet" /> {shortAddress(address)}
        </button>
      )}
      {open ? (
        <div className="td-menu" role="menu">
          <Link href="/notifications" role="menuitem" onClick={() => setOpen(false)}>Notifications</Link>
          <Link href="/settings" role="menuitem" onClick={() => setOpen(false)}>Settings</Link>
          <Link href="/backtesting" role="menuitem" onClick={() => setOpen(false)}>
            Backtesting <Badge tone="neutral">Planned</Badge>
          </Link>
          <button type="button" role="menuitem" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            Theme: {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}
          </button>
          {signIn.error ? <span className="td-note" style={{ padding: 8, color: "var(--negative)" }}>{signIn.error.message.split("\n")[0]}</span> : null}
          <button type="button" role="menuitem" onClick={async () => { if (authenticated) await signOut.mutateAsync().catch(() => {}); disconnect(); setOpen(false); }}>
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const icons = { Overview: "activity", Markets: "search", Trade: "arrow-right", Strategies: "shield", Activity: "clock" } as const;
  return (
    <nav className="td-tabbar" aria-label="Primary">
      {PRIMARY_NAV.map((it) => {
        const on = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined}>
            <Icon name={icons[it.label]} size={20} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
