import { createConfig, createStorage, cookieStorage, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { robinhoodTestnet } from "@tradh/chain";

const wcProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/** Module-scope config (wagmi uses Math.random() for connector ids; never create it during render). */
export const wagmiConfig = createConfig({
  chains: [robinhoodTestnet],
  connectors: [
    injected({ shimDisconnect: true }),
    ...(wcProjectId
      ? [walletConnect({ projectId: wcProjectId, showQrModal: true, metadata: { name: "tradh.", description: "Build, test and execute your own strategies.", url: "https://tradh.com", icons: ["https://tradh.com/brand/favicon-512.png"] } })]
      : []),
  ],
  transports: {
    [robinhoodTestnet.id]: http(process.env.NEXT_PUBLIC_RH_TESTNET_RPC_URL || undefined),
  },
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
