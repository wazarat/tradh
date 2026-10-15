import { index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { ledgerBookEnum, ledgerEventKindEnum } from "./enums";
import { users, wallets } from "./identity";
import { assetDeployments } from "./markets";

/** One portfolio per (wallet, book). Onchain and simulated books never mix (spec §9). */
export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
    book: ledgerBookEnum("book").notNull(),
    chainId: integer("chain_id").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("portfolios_user_idx").on(t.userId)],
);

export const portfolioHoldings = pgTable(
  "portfolio_holdings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
    assetDeploymentId: uuid("asset_deployment_id").notNull().references(() => assetDeployments.id),
    quantity: numeric("quantity", { precision: 38, scale: 18 }).notNull().default("0"),
    costBasisUsd: numeric("cost_basis_usd", { precision: 38, scale: 18 }).notNull().default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("holdings_portfolio_asset_uq").on(t.portfolioId, t.assetDeploymentId)],
);

/** Event-derived ledger: returns are computed from these, never from raw balance deltas. */
export const portfolioLedgerEvents = pgTable(
  "portfolio_ledger_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id, { onDelete: "cascade" }),
    kind: ledgerEventKindEnum("kind").notNull(),
    assetDeploymentId: uuid("asset_deployment_id").notNull().references(() => assetDeployments.id),
    quantityDelta: numeric("quantity_delta", { precision: 38, scale: 18 }).notNull(),
    valueUsd: numeric("value_usd", { precision: 38, scale: 18 }),
    txHash: text("tx_hash"),
    logIndex: integer("log_index"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("ledger_portfolio_time_idx").on(t.portfolioId, t.occurredAt),
    uniqueIndex("ledger_tx_log_uq").on(t.txHash, t.logIndex, t.assetDeploymentId),
  ],
);
