"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { erc20Abi, formatEther, type Address, type Hex } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { MockSpotExchangeAbi, explorerTxUrl, type Asset } from "@tradh/chain";
import { D, applySlippage, formatPercent, formatTokenAmount, formatUsd, fromUnits, toUnits, type TxState } from "@tradh/core";
import { Button, TextField, TradeSummary, TxStatus, type Row } from "@/components/td";
import { TestnetNote } from "@/components/shell/page";
import { useSession } from "@/lib/auth/use-session";
import { CHAIN_ID, useAssets, useBalances, useDeployment, useOraclePrices } from "@/lib/chain/hooks";
import { useNow } from "@/lib/use-now";

const QUOTE_TTL_MS = 30_000;
const SLIPPAGE_OPTIONS = [10, 50, 100] as const;

type Side = "buy" | "sell";
/** States the ticket controls itself; confirmed/failed are derived from the receipt. */
type LocalTxState = Extract<TxState, "draft" | "awaiting" | "submitted" | "rejected">;

function fmtAmount(units: bigint | undefined, asset: Asset): string {
  if (units === undefined) return "—";
  return asset.isQuote ? formatUsd(fromUnits(units, asset.decimals)) + " " + asset.symbol : formatTokenAmount(fromUnits(units, asset.decimals), asset.symbol, asset.displayPrecision);
}

/** Swap deadline: two minutes from the moment the wallet is asked to sign. Called only from handlers. */
function deadline(): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + 120);
}

function postJson(url: string, body: unknown, method = "POST") {
  return fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
}

export function TradeTicket({ initialSymbol }: { initialSymbol?: string }) {
  const { address } = useAccount();
  const dep = useDeployment();
  const { tradable, quote } = useAssets();
  const { byAddress: balances } = useBalances();
  const { byAddress: prices } = useOraclePrices();
  const { authenticated, me } = useSession();
  const publicClient = usePublicClient({ chainId: CHAIN_ID });
  const qc = useQueryClient();
  const now = useNow(1000);

  const [symbol, setSymbol] = useState(initialSymbol ?? tradable[0]?.symbol ?? "");
  const [side, setSide] = useState<Side>("buy");
  const [amountText, setAmountText] = useState("");
  const [slippageBps, setSlippageBps] = useState<number>(50);
  const [localState, setLocalState] = useState<LocalTxState>("draft");
  const [approveHash, setApproveHash] = useState<Hex | undefined>();
  const [swapHash, setSwapHash] = useState<Hex | undefined>();
  const [orderId, setOrderId] = useState<string | undefined>();
  const [uiError, setUiError] = useState<string | undefined>();

  const asset = tradable.find((a) => a.symbol === symbol) ?? tradable[0];
  const dex = dep?.contracts.MockSpotExchange?.address as Address | undefined;
  const tokenIn = side === "buy" ? quote : asset;
  const tokenOut = side === "buy" ? asset : quote;

  const amountIn = useMemo(() => {
    if (!tokenIn || !amountText) return undefined;
    try {
      const d = new D(amountText);
      if (!d.isFinite() || d.lte(0)) return undefined;
      return toUnits(d, tokenIn.decimals);
    } catch {
      return undefined;
    }
  }, [amountText, tokenIn]);

  const quoteQ = useReadContract({
    address: dex,
    abi: MockSpotExchangeAbi,
    functionName: "quoteExactIn",
    args: tokenIn && tokenOut && amountIn ? [tokenIn.address, tokenOut.address, amountIn] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(dex && tokenIn && tokenOut && amountIn), refetchInterval: 15_000, retry: false },
  });
  const quotedAt = quoteQ.dataUpdatedAt;

  const allowanceQ = useReadContract({
    address: tokenIn?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && dex ? [address, dex] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: Boolean(address && dex && tokenIn) },
  });

  const q = quoteQ.data;
  const minOut = q && tokenOut ? toUnits(applySlippage(fromUnits(q.amountOut, tokenOut.decimals), slippageBps), tokenOut.decimals) : undefined;

  const gasQ = useQuery({
    queryKey: ["gas", dex, tokenIn?.address, tokenOut?.address, amountIn?.toString(), minOut?.toString(), address],
    enabled: Boolean(publicClient && dex && tokenIn && tokenOut && amountIn && minOut !== undefined && address && (allowanceQ.data ?? 0n) >= (amountIn ?? 0n)),
    queryFn: async () => {
      const gas = await publicClient!.estimateContractGas({ address: dex!, abi: MockSpotExchangeAbi, functionName: "swapExactIn", args: [tokenIn!.address, tokenOut!.address, amountIn!, minOut!, address!, deadline()], account: address! });
      const price = await publicClient!.getGasPrice();
      return { gas, price, feeWei: gas * price };
    },
    staleTime: 15_000,
  });

  const { writeContractAsync, isPending: walletPending } = useWriteContract();
  const approveReceipt = useWaitForTransactionReceipt({ hash: approveHash, chainId: CHAIN_ID });
  const swapReceipt = useWaitForTransactionReceipt({ hash: swapHash, chainId: CHAIN_ID });

  // Side effects only (no setState): refresh allowance after approval; record and refresh after a swap receipt.
  useEffect(() => {
    if (approveReceipt.isSuccess) allowanceQ.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveReceipt.isSuccess]);
  useEffect(() => {
    if (!swapHash || !swapReceipt.isSuccess) return;
    qc.invalidateQueries();
    if (authenticated) postJson("/api/tx/confirm", { txHash: swapHash, orderId }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapReceipt.isSuccess, swapHash]);

  const txState: TxState = swapHash && swapReceipt.isSuccess ? (swapReceipt.data.status === "success" ? "confirmed" : "failed") : swapHash && swapReceipt.isError ? "failed" : localState;

  if (!dex || !quote || !asset || !tokenIn || !tokenOut) {
    return <div className="td-list"><div className="td-empty">Mock assets are not deployed on this network yet.</div></div>;
  }

  const balIn = balances.get(tokenIn.address)?.units;
  const insufficient = amountIn !== undefined && balIn !== undefined && amountIn > balIn;
  const needsApproval = amountIn !== undefined && (allowanceQ.data ?? 0n) < amountIn;
  const quoteAgeMs = quotedAt ? Math.max(0, now - quotedAt) : 0;
  const expired = Boolean(q) && quoteAgeMs > QUOTE_TTL_MS;
  const secondsLeft = Math.max(0, Math.ceil((QUOTE_TTL_MS - quoteAgeMs) / 1000));
  const oracle = prices.get(asset.address);
  const pricePending = !oracle?.valid;
  const approving = Boolean(approveHash) && approveReceipt.isLoading;
  const swapping = Boolean(swapHash) && swapReceipt.isLoading;
  const busy = walletPending || approving || swapping;
  const terminal = txState === "confirmed" || txState === "failed";

  const rows: Row[] = q
    ? [
        { label: "You pay", value: fmtAmount(amountIn, tokenIn), strong: true },
        { label: "Estimated receive", value: fmtAmount(q.amountOut, tokenOut), strong: true },
        { label: "Execution price", value: `${formatUsd(side === "buy" ? new D(1).div(fromUnits(q.execPrice1e18, 18)) : fromUnits(q.execPrice1e18, 18))} per ${asset.symbol}` },
        { label: "Price impact", value: formatPercent(fromUnits(q.priceImpactBps, 2).neg(), 2) },
        { label: "Slippage tolerance", value: `${(slippageBps / 100).toFixed(2)}%` },
        { label: "Network fee", value: gasQ.data ? `${Number(formatEther(gasQ.data.feeWei)).toFixed(6)} ETH` : needsApproval ? "After approval" : "Estimating…" },
        { label: "Trading fee", value: `${fmtAmount(q.lpFee + q.protocolFee, tokenIn)} (LP ${fmtAmount(q.lpFee, tokenIn)})` },
        { label: "Minimum received", value: fmtAmount(minOut, tokenOut), strong: true },
      ]
    : [];

  async function submit() {
    setUiError(undefined);
    if (!address || !amountIn || !q || minOut === undefined) return;
    try {
      if (needsApproval) {
        const h = await writeContractAsync({ address: tokenIn!.address, abi: erc20Abi, functionName: "approve", args: [dex!, amountIn], chainId: CHAIN_ID });
        setApproveHash(h);
        return;
      }
      setLocalState("awaiting");
      let id: string | undefined;
      if (authenticated) {
        const res = await postJson("/api/orders", {
          idempotencyKey: crypto.randomUUID(),
          chainId: CHAIN_ID,
          venue: dex,
          sellAddress: tokenIn!.address,
          buyAddress: tokenOut!.address,
          amountIn: fromUnits(amountIn, tokenIn!.decimals).toString(),
          quotedAmountOut: fromUnits(q.amountOut, tokenOut!.decimals).toString(),
          minAmountOut: fromUnits(minOut, tokenOut!.decimals).toString(),
          quotedPriceImpactBps: Number(q.priceImpactBps),
          slippageBps,
          lpFee: fromUnits(q.lpFee, tokenIn!.decimals).toString(),
          protocolFee: fromUnits(q.protocolFee, tokenIn!.decimals).toString(),
          quoteExpiresAt: new Date(quotedAt + QUOTE_TTL_MS).toISOString(),
        });
        if (res.ok) {
          id = ((await res.json()) as { id: string }).id;
          setOrderId(id);
        }
      }
      const h = await writeContractAsync({ address: dex!, abi: MockSpotExchangeAbi, functionName: "swapExactIn", args: [tokenIn!.address, tokenOut!.address, amountIn, minOut, address, deadline()], chainId: CHAIN_ID });
      setSwapHash(h);
      setLocalState("submitted");
      if (id) postJson(`/api/orders/${id}`, { state: "submitted", txHash: h }, "PATCH").catch(() => {});
    } catch (err) {
      const msg = err instanceof Error ? err.message.split("\n")[0]! : "Transaction failed";
      const rejected = /rejected|denied|cancel/i.test(msg);
      setLocalState(rejected ? "rejected" : "draft");
      setUiError(rejected ? "You rejected the request in your wallet." : msg);
      if (orderId) postJson(`/api/orders/${orderId}`, { state: "rejected" }, "PATCH").catch(() => {});
    }
  }

  function resetTicket() {
    setLocalState("draft");
    setOrderId(undefined);
    setApproveHash(undefined);
    setSwapHash(undefined);
    setAmountText("");
    setUiError(undefined);
  }

  const hash = swapHash ?? approveHash;

  return (
    <div className="td-grid">
      <div className="td-col-6 td-stack">
        <section className="td-card td-stack">
          <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
            <div className="td-seg" role="group" aria-label="Side">
              <button type="button" aria-pressed={side === "buy"} onClick={() => { setSide("buy"); setAmountText(""); }} disabled={busy}>Buy</button>
              <button type="button" aria-pressed={side === "sell"} onClick={() => { setSide("sell"); setAmountText(""); }} disabled={busy}>Sell</button>
            </div>
            <label className="td-label td-row-gap">
              Asset
              <select className="td-input" style={{ height: 32, padding: "0 8px" }} value={asset.symbol} onChange={(e) => { setSymbol(e.target.value); setAmountText(""); }} disabled={busy}>
                {tradable.map((a) => (
                  <option key={a.address} value={a.symbol}>{a.symbol} · {a.name}</option>
                ))}
              </select>
            </label>
          </div>
          <TextField
            label={side === "buy" ? "You pay" : "You sell"}
            inputMode="decimal"
            placeholder="0.00"
            suffix={tokenIn.symbol}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value.replace(/[^0-9.]/g, ""))}
            invalid={insufficient}
            hint={balIn !== undefined ? (insufficient ? `Above your balance of ${fmtAmount(balIn, tokenIn)}` : `Available: ${fmtAmount(balIn, tokenIn)}`) : undefined}
            disabled={busy || terminal}
          />
          <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
            <span className="td-label td-muted">Slippage tolerance</span>
            <div className="td-seg" role="group" aria-label="Slippage tolerance">
              {SLIPPAGE_OPTIONS.map((b) => (
                <button key={b} type="button" aria-pressed={slippageBps === b} onClick={() => setSlippageBps(b)} disabled={busy}>{(b / 100).toFixed(1)}%</button>
              ))}
            </div>
          </div>
          {oracle?.valid && oracle.price ? (
            <p className="td-note">Reference price {formatUsd(oracle.price)} per {asset.symbol}{oracle.ageSeconds && oracle.ageSeconds > 60 ? ` · updated ${Math.floor(oracle.ageSeconds / 60)} min ago` : ""}. Executable price comes from the pool quote.</p>
          ) : (
            <p className="td-note" style={{ color: "var(--negative)" }}>Price feed for {asset.symbol} is pending. Trading is blocked until the oracle is fresh.</p>
          )}
          {quoteQ.error ? <p className="td-note" style={{ color: "var(--negative)" }}>{(quoteQ.error.message.match(/InsufficientLiquidity|InsufficientInput|PoolMissing/)?.[0] ?? "Quote unavailable").replace(/([a-z])([A-Z])/g, "$1 $2")}.</p> : null}
          {me && !me.databaseConfigured ? <p className="td-note">Database not configured: this trade will execute on-chain but will not be recorded in Activity.</p> : null}
          {!authenticated && me?.databaseConfigured ? <p className="td-note">Sign in to record this trade in your Activity and portfolio ledger.</p> : null}
        </section>
      </div>
      <div className="td-col-6 td-stack">
        {q && amountIn ? (
          <TradeSummary
            rows={rows}
            expiresIn={!terminal ? `0:${String(secondsLeft).padStart(2, "0")}` : undefined}
            note="Testnet transaction with mock assets. No real value is exchanged."
            action={
              terminal ? (
                <div className="td-stack">
                  <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
                    <TxStatus state={txState} />
                    {swapHash ? <a className="td-note" href={explorerTxUrl(swapHash)} target="_blank" rel="noreferrer">View on explorer</a> : null}
                  </div>
                  <Button variant="secondary" size="lg" block onClick={resetTicket}>New trade</Button>
                </div>
              ) : expired && !busy ? (
                <Button size="lg" block onClick={() => quoteQ.refetch()}>Refresh quote</Button>
              ) : (
                <div className="td-stack">
                  {txState !== "draft" ? (
                    <div className="td-row-gap" style={{ justifyContent: "space-between" }}>
                      <TxStatus state={txState} />
                      {hash ? <a className="td-note" href={explorerTxUrl(hash)} target="_blank" rel="noreferrer">View on explorer</a> : null}
                    </div>
                  ) : null}
                  <Button size="lg" block onClick={submit} disabled={!address || busy || insufficient || pricePending || minOut === undefined}>
                    {walletPending ? "Confirm in wallet…" : approving ? "Approving…" : swapping ? "Submitting…" : needsApproval ? `Approve ${tokenIn.symbol}` : "Confirm in wallet"}
                  </Button>
                  {!address ? <p className="td-note">Connect a wallet to trade.</p> : null}
                </div>
              )
            }
          />
        ) : (
          <section className="td-card td-stack">
            <h3 className="td-h3">Review trade</h3>
            <p className="td-note">Enter an amount to see every cost before you sign.</p>
            <TestnetNote />
          </section>
        )}
        {uiError ? <p className="td-note" style={{ color: "var(--negative)" }}>{uiError}</p> : null}
      </div>
    </div>
  );
}
