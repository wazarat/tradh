import { bigint, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { proposalStateEnum, txStateEnum } from "./enums";
import { users, wallets } from "./identity";
import { assetDeployments, tradingVenues } from "./markets";
import { strategies, strategySignals, strategyVersions } from "./strategies";

/** A proposed trade from a strategy evaluation, waiting for a decision (spec §7). */
export const tradeProposals = pgTable(
  "trade_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
    strategyVersionId: uuid("strategy_version_id").notNull().references(() => strategyVersions.id),
    signalId: uuid("signal_id").references(() => strategySignals.id),
    state: proposalStateEnum("state").notNull().default("pending"),
    rationale: text("rationale").notNull(),
    legs: jsonb("legs").notNull(), // [{sellDeploymentId, buyDeploymentId, amountIn, estAmountOut, estPriceImpactBps}]
    estimatedCostUsd: numeric("estimated_cost_usd", { precision: 38, scale: 18 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: uuid("decided_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("proposals_strategy_state_idx").on(t.strategyId, t.state)],
);

/** Every intent to trade, manual or strategy-driven. Idempotency key prevents double execution. */
export const tradeOrders = pgTable(
  "trade_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    proposalId: uuid("proposal_id").references(() => tradeProposals.id),
    venueId: uuid("venue_id").notNull().references(() => tradingVenues.id),
    sellDeploymentId: uuid("sell_deployment_id").notNull().references(() => assetDeployments.id),
    buyDeploymentId: uuid("buy_deployment_id").notNull().references(() => assetDeployments.id),
    amountIn: numeric("amount_in", { precision: 38, scale: 18 }).notNull(),
    minAmountOut: numeric("min_amount_out", { precision: 38, scale: 18 }).notNull(),
    quotedAmountOut: numeric("quoted_amount_out", { precision: 38, scale: 18 }).notNull(),
    quotedPriceImpactBps: integer("quoted_price_impact_bps").notNull(),
    slippageBps: integer("slippage_bps").notNull(),
    lpFee: numeric("lp_fee", { precision: 38, scale: 18 }).notNull().default("0"),
    protocolFee: numeric("protocol_fee", { precision: 38, scale: 18 }).notNull().default("0"),
    quoteExpiresAt: timestamp("quote_expires_at", { withTimezone: true }).notNull(),
    state: txStateEnum("state").notNull().default("draft"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("orders_idempotency_uq").on(t.idempotencyKey), index("orders_user_state_idx").on(t.userId, t.state)],
);

export const executions = pgTable(
  "executions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => tradeOrders.id, { onDelete: "cascade" }),
    txHash: text("tx_hash").notNull(),
    chainId: integer("chain_id").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    amountIn: numeric("amount_in", { precision: 38, scale: 18 }),
    amountOut: numeric("amount_out", { precision: 38, scale: 18 }),
    lpFee: numeric("lp_fee", { precision: 38, scale: 18 }),
    protocolFee: numeric("protocol_fee", { precision: 38, scale: 18 }),
    gasUsed: bigint("gas_used", { mode: "bigint" }),
    effectiveGasPrice: bigint("effective_gas_price", { mode: "bigint" }),
    state: txStateEnum("state").notNull().default("submitted"),
  },
  (t) => [uniqueIndex("executions_tx_uq").on(t.chainId, t.txHash), index("executions_order_idx").on(t.orderId)],
);

export const transactionReceipts = pgTable(
  "transaction_receipts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: integer("chain_id").notNull(),
    txHash: text("tx_hash").notNull(),
    blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
    blockHash: text("block_hash").notNull(),
    status: text("status").notNull(), // "success" | "reverted"
    from: text("from_address").notNull(),
    to: text("to_address"),
    gasUsed: bigint("gas_used", { mode: "bigint" }).notNull(),
    effectiveGasPrice: bigint("effective_gas_price", { mode: "bigint" }).notNull(),
    logs: jsonb("logs").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("receipts_chain_tx_uq").on(t.chainId, t.txHash)],
);
