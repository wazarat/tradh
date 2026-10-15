# Security

## Threat model (Phase 1)
- Users hold their own keys; the server never sees a private key and never signs. All transactions are signed in the browser wallet.
- The server trusts nothing from the client about chain state: receipts are re-read from RPC, `from`/`to` are checked against the session wallet and the exchange, and amounts come from decoded `Swap` events.
- Sessions are opaque random ids stored in Postgres (`sessions`), 7-day expiry, httpOnly + SameSite=Lax + Secure cookies. SIWE nonces are single-use with a 10-minute TTL. State-changing routes check `Origin` against `Host`.
- Mainnet (4663) and live money are disabled in code (`ENABLE_LIVE_MONEY` is pinned false in `readFlags`).

## Secrets
- `.env*` are gitignored. `env.example` lists variables without values. The deployer key lives only in `packages/contracts/.env`.
- Vercel env vars are entered by the owner; nothing is logged.

## Contract controls
Role-gated minting and oracle writes; bounded fees; `minAmountOut` + `deadline` on swaps; reentrancy guard; pause switches; two-step ownership.

## Known gaps (tracked for later milestones)
- No rate limiting on auth routes yet (add at the edge in M4).
- Proxy-level auth is optimistic (cookie presence); every route handler re-checks the session.
- Automated execution, policy contracts and replay-safe authorizations are Milestone 4.
