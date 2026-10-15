# tradh.

Build, test and execute your own investment strategies on Robinhood Chain. Testnet MVP.

tradh. is an AI-assisted strategy-trading platform. People describe a strategy in plain English, review the exact rules, then approve each trade or authorize limited automation bounded by risk limits they set and can revoke. Phase 1 runs on **Robinhood Chain Testnet (chain 46630)** with mock assets; live money is disabled.

## Layout

```
apps/web/             Next.js 16 App Router app (UI, API routes, SIWE auth)
packages/contracts/   Foundry: mock tokens, oracle, spot exchange, fee controller
packages/core/        Pure TS: feature flags, decimal math, StrategySpec (zod), quote preview
packages/chain/       Chain config, deployment manifest, asset registry, ABIs, market adapters
packages/db/          Drizzle schema + migrations (Supabase Postgres)
docs/                 Architecture, phases, contracts, security, …
```

## Prerequisites

- Node 24, pnpm 12 (`corepack enable` or `npm i -g pnpm`)
- Foundry 1.7+ (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- A browser wallet (MetaMask, Rabby) with Robinhood Chain Testnet added
- A Supabase project (for sessions, orders, activity); the UI works wallet-only without one

## Setup

```bash
pnpm install
cp env.example apps/web/.env.local        # fill DATABASE_URL / DIRECT_URL
cp packages/contracts/.env.example packages/contracts/.env   # throwaway deployer key
pnpm db:generate && pnpm db:migrate       # once DATABASE_URL is set
pnpm dev                                  # http://localhost:3000
```

## Key commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the web app |
| `pnpm build` | Production build (typechecks packages first) |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Quality gates across the workspace |
| `pnpm contracts:test` | Foundry unit + fuzz tests |
| `pnpm --filter @tradh/chain abis` | Re-export ABIs after `forge build` |
| `pnpm --filter @tradh/web tokens` | Regenerate `app/tokens.css` from the design tokens |
| `forge script script/DeployTestnet.s.sol --rpc-url robinhood_testnet --broadcast` (in `packages/contracts`) | Deploy and seed the testnet venue |

## Network

| | |
| --- | --- |
| Chain | Robinhood Chain Testnet, id 46630, gas in ETH |
| RPC | https://rpc.testnet.chain.robinhood.com |
| Explorer | https://explorer.testnet.chain.robinhood.com |
| Faucet | https://faucet.testnet.chain.robinhood.com |

Deployed contract addresses live in `packages/chain/deployments/46630.json` and `docs/TESTNET_DEPLOYMENTS.md`.

## Status

See `docs/PHASES.md`. Milestones 0–2 (foundation, mock trading) are in progress; strategies, MCP, proposals and automation follow.

Testnet preview with mock assets. Nothing here is investment advice.
