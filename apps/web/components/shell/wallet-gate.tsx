"use client";

import { useAccount } from "wagmi";
import { robinhoodTestnet } from "@tradh/chain";
import { useSession } from "@/lib/auth/use-session";
import { EmptyState } from "./page";
import { Button } from "@/components/td";
import { useSwitchChain } from "wagmi";
import type { ReactNode } from "react";

/**
 * Renders children only when a wallet is connected on the right chain (and, if `session`,
 * a signed-in session matches it). Otherwise shows a one-line empty state with one action.
 */
export function WalletGate({ children, session = false }: { children: ReactNode; session?: boolean }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const { authenticated, me, signIn } = useSession();

  if (!isConnected) return <EmptyState text="Connect a wallet to continue." />;
  if (chainId !== robinhoodTestnet.id) {
    return (
      <EmptyState
        text="Your wallet is on another network."
        action={
          <Button size="sm" onClick={() => switchChain({ chainId: robinhoodTestnet.id })} disabled={isPending}>
            Switch to Robinhood Chain Testnet
          </Button>
        }
      />
    );
  }
  if (session && !authenticated) {
    if (me && !me.databaseConfigured) return <EmptyState text="Sign-in is unavailable: the database is not configured on this deployment." />;
    return (
      <EmptyState
        text="Sign in with your wallet to see your account."
        action={
          <Button size="sm" onClick={() => signIn.mutate()} disabled={signIn.isPending}>
            {signIn.isPending ? "Check your wallet…" : "Sign in"}
          </Button>
        }
      />
    );
  }
  return <>{children}</>;
}
