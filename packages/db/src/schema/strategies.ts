import { boolean, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { authorizationStatusEnum, executionModeEnum, strategyStatusEnum } from "./enums";
import { users, wallets } from "./identity";

/** Strategy tables are scaffolded in Milestone 1 and populated from Milestone 3. */
export const strategies = pgTable(
  "strategies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id").notNull().references(() => wallets.id),
    chainId: integer("chain_id").notNull(),
    name: text("name").notNull(),
    status: strategyStatusEnum("status").notNull().default("draft"),
    executionMode: executionModeEnum("execution_mode").notNull().default("approval"),
    currentVersionId: uuid("current_version_id"),
    nextEvaluationAt: timestamp("next_evaluation_at", { withTimezone: true }),
    lastEvaluationAt: timestamp("last_evaluation_at", { withTimezone: true }),
    emergencyPaused: boolean("emergency_paused").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("strategies_user_idx").on(t.userId), index("strategies_next_eval_idx").on(t.nextEvaluationAt)],
);

/** Immutable versions. `spec` is the validated StrategySpec JSON; `specHash` is keccak of canonical JSON. */
export const strategyVersions = pgTable(
  "strategy_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    spec: jsonb("spec").notNull(),
    specHash: text("spec_hash").notNull(),
    source: text("source").notNull(), // "ui" | "mcp" | "nl-builder"
    modelVersion: text("model_version"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("strategy_versions_uq").on(t.strategyId, t.version)],
);

export const strategyAuthorizations = pgTable(
  "strategy_authorizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
    strategyVersionId: uuid("strategy_version_id").notNull().references(() => strategyVersions.id),
    status: authorizationStatusEnum("status").notNull().default("none"),
    policyHash: text("policy_hash"),
    onchainTxHash: text("onchain_tx_hash"),
    maxTradeUsd: numeric("max_trade_usd", { precision: 38, scale: 18 }).notNull(),
    maxDailyUsd: numeric("max_daily_usd", { precision: 38, scale: 18 }).notNull(),
    maxSlippageBps: integer("max_slippage_bps").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("authorizations_strategy_idx").on(t.strategyId)],
);

export const strategyEvaluations = pgTable(
  "strategy_evaluations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
    strategyVersionId: uuid("strategy_version_id").notNull().references(() => strategyVersions.id),
    /** `${strategyId}:${scheduledFor}` — makes repeated jobs idempotent. */
    idempotencyKey: text("idempotency_key").notNull(),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    marketSnapshot: jsonb("market_snapshot"),
    outcome: text("outcome"), // "no-action" | "signal" | "blocked" | "error"
    detail: jsonb("detail"),
  },
  (t) => [uniqueIndex("evaluations_idempotency_uq").on(t.idempotencyKey)],
);

export const strategySignals = pgTable(
  "strategy_signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    evaluationId: uuid("evaluation_id").notNull().references(() => strategyEvaluations.id, { onDelete: "cascade" }),
    strategyId: uuid("strategy_id").notNull().references(() => strategies.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("signals_strategy_idx").on(t.strategyId)],
);

export const riskEvents = pgTable(
  "risk_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    strategyId: uuid("strategy_id").references(() => strategies.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    rule: text("rule").notNull(),
    severity: text("severity").notNull(), // "info" | "blocked" | "breach"
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("risk_events_strategy_idx").on(t.strategyId)],
);
