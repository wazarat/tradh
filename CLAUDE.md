# tradh. — working notes for coding agents

Read `docs/PHASES.md` for where the build is and `docs/ARCHITECTURE.md` for boundaries before changing code.

## Non-negotiables
- `ENABLE_LIVE_MONEY` stays false; mainnet 4663 is config-only. Never present mock assets as issuer-backed tokens.
- No private keys in the repo or in chat. The deployer key lives only in `packages/contracts/.env`.
- Financial math uses `decimal.js` via `@tradh/core` (`D`, `fromUnits`, `toUnits`); never JS floats for money.
- Nothing is "confirmed" before the onchain receipt. The seven tx states live in `@tradh/core` (`TX_STATES`).
- Every performance number carries a `ProvenanceTag`. Simulated, backtested, forward and live never share a series.
- Feature flags (`@tradh/core` `readFlags`) are enforced server-side, not just hidden in the UI.

## Conventions
- pnpm workspace; packages are consumed as TypeScript source (`transpilePackages` in `next.config.ts`).
- Next 16: `params`/`cookies()` are async; `proxy.ts` replaces middleware; Cache Components are OFF on purpose.
- Design system is the source of truth: `apps/web/design/tokens.json` → `pnpm --filter @tradh/web tokens` → `app/tokens.css`. Components use the `td-*` classes from `app/components.css`. Lucide icons, strokeWidth 1.75. Pills only on buttons.
- Copy: sentence case, true minus (U+2212), "5 pt" for drift, no emoji, never promise outcomes.
- Contracts: Solidity 0.8.28, OpenZeppelin 5.4, evm `paris`. After `forge build`, run `pnpm --filter @tradh/chain abis`.
- DB: Drizzle + Supabase. `DATABASE_URL` is the transaction pooler (`prepare: false`), `DIRECT_URL` for migrations.

## Git
- Commit as the repository owner with no AI attribution trailers. Do not push; the owner pushes.
- One commit per milestone step; message is a plain summary.

## Verification before claiming done
`pnpm typecheck && pnpm lint && pnpm test && pnpm contracts:test && pnpm build`, then the browser journey in `docs/PHASES.md`.
