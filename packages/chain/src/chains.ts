import { defineChain } from "viem";

/** Robinhood Chain Testnet — the only network enabled during Phase 1. */
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer.testnet.chain.robinhood.com", apiUrl: "https://explorer.testnet.chain.robinhood.com/api" },
  },
  testnet: true,
});

/** Robinhood Chain mainnet. Present for the asset registry only; disabled until ENABLE_LIVE_MONEY. */
export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com", apiUrl: "https://robinhoodchain.blockscout.com/api" },
  },
});

export const FAUCET_URL = "https://faucet.testnet.chain.robinhood.com";
export const ACTIVE_CHAIN = robinhoodTestnet;
export type SupportedChainId = typeof robinhoodTestnet.id | typeof robinhoodMainnet.id;

export function explorerTxUrl(hash: string, chainId: SupportedChainId = 46630): string {
  const base = chainId === 4663 ? robinhoodMainnet.blockExplorers.default.url : robinhoodTestnet.blockExplorers.default.url;
  return `${base}/tx/${hash}`;
}

export function explorerAddressUrl(address: string, chainId: SupportedChainId = 46630): string {
  const base = chainId === 4663 ? robinhoodMainnet.blockExplorers.default.url : robinhoodTestnet.blockExplorers.default.url;
  return `${base}/address/${address}`;
}
