import { boolean, index, integer, numeric, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { assetKindEnum, priceSourceEnum } from "./enums";

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    symbol: text("symbol").notNull(),
    name: text("name").notNull(),
    kind: assetKindEnum("kind").notNull(),
    underlyingSymbol: text("underlying_symbol"),
    isQuote: boolean("is_quote").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("assets_symbol_kind_uq").on(t.symbol, t.kind)],
);

/** Where an asset lives. Identity for trading is (chain_id, address). */
export const assetDeployments = pgTable(
  "asset_deployments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id").notNull().references(() => assets.id, { onDelete: "cascade" }),
    chainId: integer("chain_id").notNull(),
    address: text("address").notNull(),
    decimals: integer("decimals").notNull(),
    verified: boolean("verified").notNull().default(false),
    verificationSource: text("verification_source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("asset_deployments_chain_addr_uq").on(t.chainId, t.address)],
);

export const marketPrices = pgTable(
  "market_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetDeploymentId: uuid("asset_deployment_id").notNull().references(() => assetDeployments.id, { onDelete: "cascade" }),
    source: priceSourceEnum("source").notNull(),
    priceUsd: numeric("price_usd", { precision: 38, scale: 18 }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    halted: boolean("halted").notNull().default(false),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("market_prices_asset_time_idx").on(t.assetDeploymentId, t.observedAt)],
);

export const tradingVenues = pgTable(
  "trading_venues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chainId: integer("chain_id").notNull(),
    address: text("address").notNull(),
    name: text("name").notNull(),
    kind: text("kind").notNull(), // "mock-spot-exchange" | "external-dex" | "own-amm"
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("venues_chain_addr_uq").on(t.chainId, t.address)],
);

export const liquidityPools = pgTable(
  "liquidity_pools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    venueId: uuid("venue_id").notNull().references(() => tradingVenues.id, { onDelete: "cascade" }),
    baseDeploymentId: uuid("base_deployment_id").notNull().references(() => assetDeployments.id),
    quoteDeploymentId: uuid("quote_deployment_id").notNull().references(() => assetDeployments.id),
    lpFeeBps: integer("lp_fee_bps").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pools_venue_pair_uq").on(t.venueId, t.baseDeploymentId, t.quoteDeploymentId)],
);
