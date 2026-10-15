# Phases and milestones

Status legend: **Live** (works on testnet), **In development**, **Planned**.

## Phase 1 — Launch: Testnet MVP

| Milestone | Scope | Status |
| --- | --- | --- |
| 0 Audit & plan | Repo bootstrap, docs, schema, contract architecture | Done |
| 1 Foundation | Network config, wallet connect, SIWE, Supabase schema, design system, app shell, pages | Done (pending Supabase credentials for migrations) |
| 2 Mock trading | Mock tokens, mUSD faucet, oracle, exchange, fee controller, trade UI, receipt recording | Code + tests done; **testnet deployment pending a funded deployer key** |
| 3 Strategy engine | `StrategySpec` UI, NL builder (Claude API), tradh MCP server, versioning, scheduled evaluation | Planned |
| 4 Controlled execution | Proposals, approval flow, risk engine, `StrategyPolicyManager`, `ExecutionRouter`, automation, revocation, notifications | Planned |
| 5 Portfolio & testing | Event-derived returns, simulation scenarios, Playwright e2e, security tests, deployment verification | Planned |

Phase 1 acceptance = the 22-step journey in the master spec §11. Steps 1–6 and 15–17 are exercisable after Milestone 2 deploys.

## Phase 2 — Next: research and exchange expansion (Planned)
Historical backtesting (licensed data, proxies for Stock Tokens), stress tests, paid research tiers, external venue adapters, proprietary liquidity module. Not started; `ENABLE_HISTORICAL_BACKTESTING`, `ENABLE_PAID_RESEARCH`, `ENABLE_EXTERNAL_DEX_ROUTING`, `ENABLE_OWN_EXCHANGE` stay off.

## Phase 3 — Later: ERC-8004 and discovery (Planned)
Agent identities, validation evidence, reputation, strategy discovery and non-executing following. Schema reserves tables; nothing implemented.

## Milestone 2 deployment runbook
1. Create a throwaway key; put it in `packages/contracts/.env` as `DEPLOYER_PRIVATE_KEY`. Fund it at https://faucet.testnet.chain.robinhood.com.
2. `cd packages/contracts && forge script script/DeployTestnet.s.sol --rpc-url robinhood_testnet --broadcast`
3. Verify each contract: `forge verify-contract <addr> src/<Name>.sol:<Name> --chain-id 46630 --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/`
4. Copy `deployments/46630.raw.json` into `packages/chain/deployments/46630.json` (set `deployedAt`, `commit`, per-contract `txHash`/`verified`).
5. `pnpm --filter @tradh/chain abis`, `pnpm typecheck`, `pnpm build`; update `docs/TESTNET_DEPLOYMENTS.md` with explorer links.

## Browser verification journey (M1–M2)
Connect wallet → wrong-network banner → switch to 46630 → claim mUSD → Markets shows mock assets with Mock badge and price age → asset detail → Trade shows all cost rows and countdown → approve → swap → Submitted → Confirmed with explorer link → Activity and Overview updated. Failure cases: stale oracle blocks trade; expired quote swaps CTA to "Refresh quote"; wallet rejection shows Rejected.
