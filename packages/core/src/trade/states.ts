/** The seven transaction states (spec §5.1-D). Nothing is "confirmed" before the onchain receipt. */
export const TX_STATES = ["draft", "awaiting", "submitted", "confirmed", "failed", "expired", "rejected"] as const;
export type TxState = (typeof TX_STATES)[number];

export const STRATEGY_STATUSES = ["draft", "awaiting", "authorized", "paused", "archived"] as const;
export type StrategyStatus = (typeof STRATEGY_STATUSES)[number];

export const EXECUTION_MODES = ["manual", "approval", "automated"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

/** Where a performance number came from. Never merged into one series. */
export const PROVENANCE_KINDS = ["simulated", "backtested", "forward", "live"] as const;
export type ProvenanceKind = (typeof PROVENANCE_KINDS)[number];

export const TX_TRANSITIONS: Record<TxState, readonly TxState[]> = {
  draft: ["awaiting", "rejected", "expired"],
  awaiting: ["submitted", "rejected", "expired"],
  submitted: ["confirmed", "failed"],
  confirmed: [],
  failed: [],
  expired: [],
  rejected: [],
};

export function canTransition(from: TxState, to: TxState): boolean {
  return TX_TRANSITIONS[from].includes(to);
}
