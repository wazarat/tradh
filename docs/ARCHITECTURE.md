# Architecture

## Components (spec §4) and where they live

| # | Component | Location | Status |
| --- | --- | --- | --- |
| 1 | Market data service | `packages/chain/src/market/*`, `apps/web/lib/chain/hooks.ts` | Mock oracle + Robinhood reference adapter |
| 2 | Asset registry | `packages/chain/src/assets.ts` (from `deployments/46630.json`) | Live |
| 3 | Strategy spec & validation | `packages/core/src/strategy/spec.ts` (zod) | Schema done; UI in M3 |
| 4 | AI / MCP interface | `apps/mcp` (planned) | M3 |
| 5 | Signal engine | `packages/core/src/strategy/*` (planned) | M3 |
| 6 | Risk & policy engine | `packages/core` + `StrategyPolicyManager.sol` (planned) | M4 |
| 7 | Execution & venue adapters | `packages/contracts/src/interfaces/ISpotExchange.sol`, `apps/web/lib/trading/*` | Mock venue live |
| 8 | Smart contracts | `packages/contracts` | M2 set done |
| 9 | Portfolio accounting | `packages/db` ledger tables, `/api/portfolio` | Ledger events written on confirm; returns in M5 |
| 10 | Notifications | `packages/db` `notifications` table | Table only; M4 |
| 11 | Backtesting | — | Phase 2 |
| 12 | Billing | — | Phase 2 |
| 13 | Reputation | — | Phase 3 |

## Boundaries

- **`@tradh/core`** is pure TypeScript with no React, no network: flags, decimal math, the `StrategySpec` schema, quote preview math, state machines. Everything numerical and every rule lives here so it is unit-testable and reusable by the MCP server and workers.
- **`@tradh/chain`** knows about chains, contracts and ABIs. It exports the deployment manifest, the asset registry keyed by `(chainId, address)`, viem clients, and market-data adapters. It never touches the database.
- **`@tradh/db`** is the Drizzle schema and client only. No business logic.
- **`apps/web`** composes the three: App Router pages, client hooks (wagmi + TanStack Query), SIWE auth, and route handlers that persist orders, receipts and ledger events. Server code verifies everything against the chain (receipts are re-read from RPC; client-supplied amounts are never trusted).

## Data flow for a manual trade (Mode A)

1. Client reads `quoteExactIn` from `MockSpotExchange` (refetched every 15 s; 30 s validity in the UI).
2. User reviews the TradeSummary rows (pay, receive, execution price, impact, slippage, network fee, trading fee, minimum received).
3. If signed in, client POSTs a draft order (`/api/orders`, idempotent) then asks the wallet to sign `approve` (if needed) and `swapExactIn(minOut, deadline)`.
4. Client waits for the receipt; the UI state moves draft → awaiting → submitted → confirmed/failed.
5. Client POSTs the hash to `/api/tx/confirm`; the server fetches the receipt, checks `from` and `to`, decodes the `Swap` event, and writes `transaction_receipts`, `executions` and two `portfolio_ledger_events` (idempotent on tx hash).

## Decisions

- **Cache Components off** in Next 16: every app page is request-bound (cookies, wallet, live chain reads); the static-shell model adds Suspense/`connection()` ceremony for no benefit here.
- **SIWE sessions in Postgres** (opaque cookie id) rather than JWTs so revocation is immediate.
- **Supabase transaction pooler** with `prepare: false`; direct URL only for migrations.
- **Mock venue is x·y=k** with a bounded LP fee and an optional protocol fee routed by `FeeController`; not an audited DEX. Phase 2 replaces it behind `ISpotExchange`.
- **Reference prices are informational**: the Robinhood `rhj` API describes mainnet tokens; it is never an executable price. Trading uses pool quotes and the mock oracle for valuation and staleness gating.
