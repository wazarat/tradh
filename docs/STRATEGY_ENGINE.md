# Strategy engine (schema done; evaluation planned for Milestone 3)

`StrategySpec` (`packages/core/src/strategy/spec.ts`) is the source of truth: assets by `(chainId, address)`, target weights as decimal strings that sum to 100 with `cashPct`, drift measured in **percentage points**, risk limits (`maxTradeUsd`, `maxDailyUsd`, `maxAllocationPct`, `minReserveUsd`, `maxSlippageBps`, `maxPriceAgeSeconds`, `leverage: false`), allowed venues, execution mode, authorization state and emergency pause. Every save creates a new `strategy_versions` row with a keccak hash of the canonical JSON (`canonicalize`).

Evaluation (M3) runs as durable jobs keyed by `${strategyId}:${scheduledFor}` (unique in `strategy_evaluations`) so retries are idempotent; it loads the version, takes a market snapshot, checks freshness, computes target vs. current, applies risk limits, and emits proposals routed by mode.
