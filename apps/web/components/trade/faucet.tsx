"use client";

import { useEffect } from "react";
import { useNow } from "@/lib/use-now";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MockUSDAbi, FAUCET_URL, explorerTxUrl } from "@tradh/chain";
import { formatUsd, fromUnits } from "@tradh/core";
import { Button } from "@/components/td";
import { CHAIN_ID, useAssets } from "@/lib/chain/hooks";

/** "Get test assets": claims mUSD from the on-chain faucet; links to the ETH faucet for gas. */
export function FaucetPanel() {
  const { address } = useAccount();
  const { quote } = useAssets();
  const qc = useQueryClient();
  const nowMs = useNow(1000);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: CHAIN_ID });
  const lastClaim = useReadContract({ address: quote?.address, abi: MockUSDAbi, functionName: "lastClaimAt", args: address ? [address] : undefined, chainId: CHAIN_ID, query: { enabled: Boolean(quote && address) } });
  const claimed = useReadContract({ address: quote?.address, abi: MockUSDAbi, functionName: "totalClaimed", args: address ? [address] : undefined, chainId: CHAIN_ID, query: { enabled: Boolean(quote && address) } });

  useEffect(() => {
    if (receipt.isSuccess) {
      qc.invalidateQueries();
      lastClaim.refetch();
      claimed.refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  if (!quote) return null;
  const nextAt = lastClaim.data ? Number(lastClaim.data) + 24 * 3600 : 0;
  const now = Math.floor(nowMs / 1000);
  const coolingDown = nextAt > now;
  const capReached = claimed.data !== undefined && claimed.data >= 100_000n * 1_000_000n;

  return (
    <section className="td-card td-stack">
      <div className="td-eyebrow">Test assets</div>
      <h3 className="td-h3">Get mock USD</h3>
      <p className="td-note">
        The faucet mints {formatUsd(10_000)} mUSD per claim, once a day, up to {formatUsd(100_000)} per wallet. mUSD is a testnet asset with no value. Gas is paid in testnet ETH from the{" "}
        <a href={FAUCET_URL} target="_blank" rel="noreferrer">Robinhood Chain faucet</a>.
      </p>
      {claimed.data !== undefined ? <p className="td-note">Claimed so far: {formatUsd(fromUnits(claimed.data, 6))}</p> : null}
      <div className="td-row-gap">
        <Button
          variant="secondary"
          disabled={!address || isPending || receipt.isLoading || coolingDown || capReached}
          onClick={() => {
            reset();
            writeContract({ address: quote.address, abi: MockUSDAbi, functionName: "faucet", chainId: CHAIN_ID });
          }}
        >
          {isPending ? "Check your wallet…" : receipt.isLoading ? "Minting…" : capReached ? "Faucet cap reached" : coolingDown ? `Available in ${Math.ceil((nextAt - now) / 3600)} h` : "Claim 10,000 mUSD"}
        </Button>
        {hash ? (
          <a className="td-note" href={explorerTxUrl(hash)} target="_blank" rel="noreferrer">
            View transaction
          </a>
        ) : null}
      </div>
      {error ? <p className="td-note" style={{ color: "var(--negative)" }}>{error.message.split("\n")[0]}</p> : null}
    </section>
  );
}
