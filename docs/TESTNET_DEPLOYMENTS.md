# Testnet deployments — Robinhood Chain Testnet (46630)

Status: **not deployed yet**. The deploy script is ready (`packages/contracts/script/DeployTestnet.s.sol`); it needs a throwaway deployer key funded from the faucet. See the runbook in `docs/PHASES.md`.

| Contract | Address | Deploy tx | Verified |
| --- | --- | --- | --- |
| MockUSD | — | — | — |
| MockPriceOracle | — | — | — |
| FeeController | — | — | — |
| MockSpotExchange | — | — | — |
| mAAPL | — | — | — |
| mNVDA | — | — | — |
| mMSFT | — | — | — |

The machine-readable manifest is `packages/chain/deployments/46630.json`. ABIs: `packages/chain/src/abis`.

Verification command (Blockscout):
```
forge verify-contract <address> src/<Name>.sol:<Name> --chain-id 46630 --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/
```
