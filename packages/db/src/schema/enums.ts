import { pgEnum } from "drizzle-orm/pg-core";

export const txStateEnum = pgEnum("tx_state", ["draft", "awaiting", "submitted", "confirmed", "failed", "expired", "rejected"]);
export const strategyStatusEnum = pgEnum("strategy_status", ["draft", "awaiting", "authorized", "paused", "archived"]);
export const executionModeEnum = pgEnum("execution_mode", ["manual", "approval", "automated"]);
export const assetKindEnum = pgEnum("asset_kind", ["mock", "issuer"]);
export const priceSourceEnum = pgEnum("price_source", ["mock-oracle", "robinhood-reference"]);
export const ledgerEventKindEnum = pgEnum("ledger_event_kind", ["deposit", "withdrawal", "trade_in", "trade_out", "fee", "faucet", "adjustment"]);
export const ledgerBookEnum = pgEnum("ledger_book", ["onchain", "simulated"]);
export const proposalStateEnum = pgEnum("proposal_state", ["pending", "approved", "rejected", "expired", "executed", "superseded"]);
export const notificationKindEnum = pgEnum("notification_kind", [
  "strategy_signal",
  "approval_required",
  "execution_confirmed",
  "execution_failed",
  "price_feed_failure",
  "risk_limit_breach",
  "authorization_expiring",
  "strategy_paused",
  "system",
]);
export const authorizationStatusEnum = pgEnum("authorization_status", ["none", "requested", "granted", "revoked", "expired"]);
