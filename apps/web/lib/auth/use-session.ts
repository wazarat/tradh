"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSiweMessage } from "viem/siwe";
import { useAccount, useSignMessage } from "wagmi";
import { robinhoodTestnet } from "@tradh/chain";

export interface MeResponse {
  authenticated: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
  expiresAt: string | null;
  databaseConfigured: boolean;
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "";
    try {
      detail = ((await res.json()) as { error?: string }).error ?? "";
    } catch {}
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Server session state plus SIWE sign-in / sign-out actions. */
export function useSession() {
  const qc = useQueryClient();
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const me = useQuery({ queryKey: ["me"], queryFn: () => fetch("/api/auth/me").then((r) => readJson<MeResponse>(r)) });

  const signIn = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect a wallet first");
      if (chainId !== robinhoodTestnet.id) throw new Error("Switch to Robinhood Chain Testnet");
      const { nonce } = await fetch("/api/auth/nonce").then((r) => readJson<{ nonce: string }>(r));
      const message = createSiweMessage({
        address,
        chainId: robinhoodTestnet.id,
        domain: window.location.host,
        uri: window.location.origin,
        nonce,
        version: "1",
        statement: "Sign in to tradh. This signature does not send a transaction or cost gas.",
        issuedAt: new Date(),
      });
      const signature = await signMessageAsync({ message });
      await fetch("/api/auth/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, signature }) }).then((r) => readJson(r));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  const signOut = useMutation({
    mutationFn: () => fetch("/api/auth/logout", { method: "POST" }).then((r) => readJson(r)),
    onSuccess: () => qc.invalidateQueries(),
  });

  const sessionMatchesWallet = Boolean(me.data?.authenticated && address && me.data.address?.toLowerCase() === address.toLowerCase());

  return { me: me.data, isLoading: me.isLoading, authenticated: sessionMatchesWallet, signIn, signOut };
}
