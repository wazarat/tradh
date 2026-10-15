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

## CanHav studio mapping (project e38146fd, Robinhood testnet, propose mode)

Shapes: **Stock and fund tokens** (`tokenized_security`, feature "Built on an exchange's stock tokens") and **Basic AMM pool** (`basic_amm_pool`). Template decisions: accepted Robinhood Stock Tokens, Chainlink Data Feeds, Safe Smart Account, Uniswap v2 (reference and Phase 2 route); issuer suites, Pons peg pairing, LP staking, stableswap and Balancer rejected; v3/v4, hooks, LFJ, PancakeSwap and ACE left open for Phase 2.

| CanHav step | tradh. status | Evidence |
| --- | --- | --- |
| Name both tokens, token integration checklist | Done | `packages/contracts/src/MockSpotExchange.sol`, `docs/CONTRACTS.md` |
| Swap surface with quote, slippage bound, deadline | Done | `apps/web/components/trade/trade-ticket.tsx` |
| Protocol fee switch and key | Done | `packages/contracts/src/FeeController.sol` |
| Issuer and token standard | Done | `docs/CONTRACTS.md` |
| Price feed and market hours | Done | `MockPriceOracle.sol`, `packages/chain/src/market` |
| Issuer, backing and rights before purchase | Done | asset detail and trade ticket copy |
| Seed through the router at the reference ratio | Open until deployed | `script/DeployTestnet.s.sol` |
| Testnet manifest | Open until deployed | `packages/chain/deployments/46630.json` |
| Pair invariants as property tests | Open | extend `test/MockSpotExchange.t.sol` to the five pool-invariant statements |
| Eligibility, corporate actions | Open (mainnet phase) | ERC-8056 multiplier, jurisdiction rules |
| Review passes (10) | Open | run after deployment: static analysis, keys, pool init, manifest, MEV, invariants, environment, LP disclosure, transfer rules, issuer powers |
| Deploy Uniswap stack, LP divergence disclosure, issuer controls, eligibility invariants | Not applicable | own mock venue, operator-only liquidity, not an issuer |

Before CanHav can publish: the owner accepts the proposals under Agent changes and ticks the Robinhood distribution acknowledgement in Reality. Token launch is optional and not part of Phase 1.
