import { createPublicClient, http, type PublicClient } from "viem";
import { robinhoodTestnet } from "./chains";

let cached: PublicClient | undefined;

/** Server-side read client. Override the RPC with RH_TESTNET_RPC_URL (e.g. an Alchemy URL). */
export function getPublicClient(rpcUrl: string | undefined = process.env.RH_TESTNET_RPC_URL): PublicClient {
  if (!cached) {
    cached = createPublicClient({ chain: robinhoodTestnet, transport: http(rpcUrl || undefined, { batch: true }) });
  }
  return cached;
}
