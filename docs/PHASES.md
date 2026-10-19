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

## CanHav plan (live project aa32f878 "tradh", Robinhood testnet, propose mode)

Shapes: **Stock and fund tokens** (`tokenized_security`, feature "Built on an exchange's stock tokens") and **Basic AMM pool** (`basic_amm_pool`). Accepted templates: Robinhood Stock Tokens, Chainlink Data Feeds, Safe Smart Account, Uniswap v2 (reference and Phase 2 route). Studio state after acceptance: 6 of 17 build steps done, 4 not applicable, 10 review passes open, validation blocked only by the Robinhood distribution acknowledgement.

### Sequence, with the CanHav item each step closes

| # | Work | Owner | Closes |
| --- | --- | --- | --- |
| 0 | Push `main`; Postgres URLs in `.env.local`; funded deployer key; tick the acknowledgement; publish | Wazarat | Studio validation, public page |
| 1 | Run the migration, verify SIWE sign-in and order recording end to end | agent | Milestone 1 acceptance |
| 2 | Deploy, verify on Blockscout, seed pools at the reference ratio; write the manifest in CanHav's record format (address, sourceRepo, commitHash, compiler, runtimeCodeHash, deploymentTxn, explorer, verified, deployedOn) and a script that calls a view on every address | agent | `basic_amm_pool.manifest`, `basic_amm_pool.seed`, custom step 1, review: pool-manifest, pool-environment, pool-init |
| 3 | Pool invariant suite: one handler, one invariant per statement 1–4 (reserve product, share supply and locked 1,000, mint shares, burn returns), statement 5 (price accumulators) marked not applicable because the venue has no TWAP; traces and seeds recorded | agent | `basic_amm_pool.invariants`, review: pool-invariants |
| 4 | Static analysis (Slither) over every contract, findings closed or justified in `docs/SECURITY.md` | agent | review: static |
| 5 | Role table in `docs/SECURITY.md` following the CanHav role model (Owner, Fee manager, Sentinel, Automation bot); testnet runs on one deployer key, so the pass reads Fail with the Safe plan until mainnet | agent | review: keys |
| 6 | Transfer-rules worksheet for building on exchange tokens (Robinhood eligibility, market hours, halts; mock tokens unrestricted) and ERC-8056 multiplier handling in the registry and ledger | agent | `tokenized_security.eligibility`, `tokenized_security.corporate-actions`, review: transfer-rules, issuer-powers (issuer powers: N/A, not an issuer) |
| 7 | Milestone 3: StrategySpec UI, plain-English builder, tradh MCP server, versioning, scheduled evaluation | agent | custom step 2 |
| 8 | Milestone 4: proposals, approval flow, risk engine, StrategyPolicyManager, ExecutionRouter, revocation, notifications; the automation bot gets a scoped policy key | agent | custom step 3, review: keys (bot) |
| 9 | Milestone 5: ledger-derived returns, eight Simulated scenarios, Playwright journey, MEV fork simulations (sandwich, JIT, oracle manipulation) on the mock pool | agent | custom step 4, `tokenized_security.testnet`, review: mev, both `.review` steps |

Not applicable and why: Uniswap v2 stack on testnet (own venue), LP divergence-loss screen (operator-only liquidity), issuer controls and eligibility invariants (not an issuer). A Phase 2 external route to Uniswap on mainnet 4663 reopens the stack and LP items.

### Evidence conventions
Every tick carries a file path, test name or transaction. Verdicts go to the studio through `update_project` `kit.review` with the pass id. Simulated, backtested, forward and live results never share a series; Testnet labels stay on every surface while `ENABLE_LIVE_MONEY` is off.
