# Contracts (Phase 1)

All contracts are **testnet-only development contracts**. They are not audited and must not hold real value.

| Contract | Purpose | Key controls |
| --- | --- | --- |
| `MockStockToken` | ERC-20 simulation of equity exposure (`mAAPL`, `mNVDA`, `mMSFT`), 18 decimals | `MINTER_ROLE` only; `isMock()` returns true; `underlyingSymbol` informational |
| `MockUSD` | 6-decimal settlement asset | `faucet()`: 10,000 per 24 h, 100,000 lifetime per address; `MINTER_ROLE` |
| `MockPriceOracle` | USD prices ×1e8 with timestamps | `ORACLE_ROLE` writes; `getPrice` reverts when stale (`maxPriceAge`, 1 h) or paused; `peekPrice` is non-reverting |
| `MockSpotExchange` | Constant-product pools asset/mUSD | LP fee ≤ 1 % (30 bps at deploy), optional protocol fee via `FeeController`, `minAmountOut` + `deadline`, `ReentrancyGuard`, `Pausable`, `SafeERC20`, `Ownable2Step`, uint112 reserves, 1,000 locked minimum shares |
| `FeeController` | Bounded platform fee | `protocolFeeBps` ≤ 100 (starts at 0), recipient, exemptions |

Planned for Milestone 4: `StrategyPolicyManager` (policy hashes, allowed assets/venues, spend limits, expiry, revocation, emergency pause) and `ExecutionRouter` (allowlisted adapters, fresh quotes, min-out, replay protection, fee accounting). `ISpotExchange` is the adapter boundary.

## Quote semantics
`quoteExactIn(tokenIn, tokenOut, amountIn)` returns `amountOut`, `lpFee`, `protocolFee` (both in `tokenIn` units), `spotPrice1e18` and `execPrice1e18` (tokenOut per tokenIn, decimals-adjusted) and `priceImpactBps`. The LP fee stays in the pool; the protocol fee is transferred to the fee recipient at swap time.

## Risks
- x·y=k with small pools: large orders have high impact by design. The UI shows impact and enforces `minAmountOut`.
- Oracle is operator-controlled: fine for a demo, unacceptable for real money. Phase 2 uses issuer/Chainlink feeds.
- Faucet limits are per address; Sybil claims are possible and irrelevant on testnet.
- No upgradeability; redeploy to change.

## Build & test
`forge build`, `forge test` (24 tests incl. fuzz: k-invariant, fee bounds, staleness, faucet caps, role checks). ABIs exported to `packages/chain/src/abis`.
