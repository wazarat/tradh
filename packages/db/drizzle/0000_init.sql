CREATE TYPE "public"."asset_kind" AS ENUM('mock', 'issuer');--> statement-breakpoint
CREATE TYPE "public"."authorization_status" AS ENUM('none', 'requested', 'granted', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."execution_mode" AS ENUM('manual', 'approval', 'automated');--> statement-breakpoint
CREATE TYPE "public"."ledger_book" AS ENUM('onchain', 'simulated');--> statement-breakpoint
CREATE TYPE "public"."ledger_event_kind" AS ENUM('deposit', 'withdrawal', 'trade_in', 'trade_out', 'fee', 'faucet', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('strategy_signal', 'approval_required', 'execution_confirmed', 'execution_failed', 'price_feed_failure', 'risk_limit_breach', 'authorization_expiring', 'strategy_paused', 'system');--> statement-breakpoint
CREATE TYPE "public"."price_source" AS ENUM('mock-oracle', 'robinhood-reference');--> statement-breakpoint
CREATE TYPE "public"."proposal_state" AS ENUM('pending', 'approved', 'rejected', 'expired', 'executed', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."strategy_status" AS ENUM('draft', 'awaiting', 'authorized', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."tx_state" AS ENUM('draft', 'awaiting', 'submitted', 'confirmed', 'failed', 'expired', 'rejected');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "siwe_nonces" (
	"nonce" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"display_name" text,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"label" text,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"decimals" integer NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verification_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"symbol" text NOT NULL,
	"name" text NOT NULL,
	"kind" "asset_kind" NOT NULL,
	"underlying_symbol" text,
	"is_quote" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liquidity_pools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"base_deployment_id" uuid NOT NULL,
	"quote_deployment_id" uuid NOT NULL,
	"lp_fee_bps" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "market_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_deployment_id" uuid NOT NULL,
	"source" "price_source" NOT NULL,
	"price_usd" numeric(38, 18) NOT NULL,
	"observed_at" timestamp with time zone NOT NULL,
	"halted" boolean DEFAULT false NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trading_venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_holdings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"asset_deployment_id" uuid NOT NULL,
	"quantity" numeric(38, 18) DEFAULT '0' NOT NULL,
	"cost_basis_usd" numeric(38, 18) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_ledger_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_id" uuid NOT NULL,
	"kind" "ledger_event_kind" NOT NULL,
	"asset_deployment_id" uuid NOT NULL,
	"quantity_delta" numeric(38, 18) NOT NULL,
	"value_usd" numeric(38, 18),
	"tx_hash" text,
	"log_index" integer,
	"occurred_at" timestamp with time zone NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid,
	"book" "ledger_book" NOT NULL,
	"chain_id" integer NOT NULL,
	"name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid,
	"user_id" uuid,
	"rule" text NOT NULL,
	"severity" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"chain_id" integer NOT NULL,
	"name" text NOT NULL,
	"status" "strategy_status" DEFAULT 'draft' NOT NULL,
	"execution_mode" "execution_mode" DEFAULT 'approval' NOT NULL,
	"current_version_id" uuid,
	"next_evaluation_at" timestamp with time zone,
	"last_evaluation_at" timestamp with time zone,
	"emergency_paused" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_authorizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"strategy_version_id" uuid NOT NULL,
	"status" "authorization_status" DEFAULT 'none' NOT NULL,
	"policy_hash" text,
	"onchain_tx_hash" text,
	"max_trade_usd" numeric(38, 18) NOT NULL,
	"max_daily_usd" numeric(38, 18) NOT NULL,
	"max_slippage_bps" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"strategy_version_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"scheduled_for" timestamp with time zone NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"market_snapshot" jsonb,
	"outcome" text,
	"detail" jsonb
);
--> statement-breakpoint
CREATE TABLE "strategy_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evaluation_id" uuid NOT NULL,
	"strategy_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"spec" jsonb NOT NULL,
	"spec_hash" text NOT NULL,
	"source" text NOT NULL,
	"model_version" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"tx_hash" text NOT NULL,
	"chain_id" integer NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"amount_in" numeric(38, 18),
	"amount_out" numeric(38, 18),
	"lp_fee" numeric(38, 18),
	"protocol_fee" numeric(38, 18),
	"gas_used" bigint,
	"effective_gas_price" bigint,
	"state" "tx_state" DEFAULT 'submitted' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"wallet_id" uuid NOT NULL,
	"proposal_id" uuid,
	"venue_id" uuid NOT NULL,
	"sell_deployment_id" uuid NOT NULL,
	"buy_deployment_id" uuid NOT NULL,
	"amount_in" numeric(38, 18) NOT NULL,
	"min_amount_out" numeric(38, 18) NOT NULL,
	"quoted_amount_out" numeric(38, 18) NOT NULL,
	"quoted_price_impact_bps" integer NOT NULL,
	"slippage_bps" integer NOT NULL,
	"lp_fee" numeric(38, 18) DEFAULT '0' NOT NULL,
	"protocol_fee" numeric(38, 18) DEFAULT '0' NOT NULL,
	"quote_expires_at" timestamp with time zone NOT NULL,
	"state" "tx_state" DEFAULT 'draft' NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"strategy_id" uuid NOT NULL,
	"strategy_version_id" uuid NOT NULL,
	"signal_id" uuid,
	"state" "proposal_state" DEFAULT 'pending' NOT NULL,
	"rationale" text NOT NULL,
	"legs" jsonb NOT NULL,
	"estimated_cost_usd" numeric(38, 18),
	"expires_at" timestamp with time zone NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"tx_hash" text NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" text NOT NULL,
	"status" text NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text,
	"gas_used" bigint NOT NULL,
	"effective_gas_price" bigint NOT NULL,
	"logs" jsonb NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"subject_type" text,
	"subject_id" text,
	"detail" jsonb,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"payload" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_deployments" ADD CONSTRAINT "asset_deployments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquidity_pools" ADD CONSTRAINT "liquidity_pools_venue_id_trading_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."trading_venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquidity_pools" ADD CONSTRAINT "liquidity_pools_base_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("base_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "liquidity_pools" ADD CONSTRAINT "liquidity_pools_quote_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("quote_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_asset_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("asset_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_holdings" ADD CONSTRAINT "portfolio_holdings_asset_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("asset_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_ledger_events" ADD CONSTRAINT "portfolio_ledger_events_portfolio_id_portfolios_id_fk" FOREIGN KEY ("portfolio_id") REFERENCES "public"."portfolios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_ledger_events" ADD CONSTRAINT "portfolio_ledger_events_asset_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("asset_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_events" ADD CONSTRAINT "risk_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategies" ADD CONSTRAINT "strategies_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_authorizations" ADD CONSTRAINT "strategy_authorizations_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_authorizations" ADD CONSTRAINT "strategy_authorizations_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_evaluations" ADD CONSTRAINT "strategy_evaluations_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_evaluations" ADD CONSTRAINT "strategy_evaluations_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_signals" ADD CONSTRAINT "strategy_signals_evaluation_id_strategy_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."strategy_evaluations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_signals" ADD CONSTRAINT "strategy_signals_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_versions" ADD CONSTRAINT "strategy_versions_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_versions" ADD CONSTRAINT "strategy_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "executions" ADD CONSTRAINT "executions_order_id_trade_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."trade_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_proposal_id_trade_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."trade_proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_venue_id_trading_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."trading_venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_sell_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("sell_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_orders" ADD CONSTRAINT "trade_orders_buy_deployment_id_asset_deployments_id_fk" FOREIGN KEY ("buy_deployment_id") REFERENCES "public"."asset_deployments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_strategy_id_strategies_id_fk" FOREIGN KEY ("strategy_id") REFERENCES "public"."strategies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_strategy_version_id_strategy_versions_id_fk" FOREIGN KEY ("strategy_version_id") REFERENCES "public"."strategy_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_signal_id_strategy_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."strategy_signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_proposals" ADD CONSTRAINT "trade_proposals_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_address_chain_uq" ON "wallets" USING btree ("address","chain_id");--> statement-breakpoint
CREATE INDEX "wallets_user_idx" ON "wallets" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_deployments_chain_addr_uq" ON "asset_deployments" USING btree ("chain_id","address");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_symbol_kind_uq" ON "assets" USING btree ("symbol","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "pools_venue_pair_uq" ON "liquidity_pools" USING btree ("venue_id","base_deployment_id","quote_deployment_id");--> statement-breakpoint
CREATE INDEX "market_prices_asset_time_idx" ON "market_prices" USING btree ("asset_deployment_id","observed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "venues_chain_addr_uq" ON "trading_venues" USING btree ("chain_id","address");--> statement-breakpoint
CREATE UNIQUE INDEX "holdings_portfolio_asset_uq" ON "portfolio_holdings" USING btree ("portfolio_id","asset_deployment_id");--> statement-breakpoint
CREATE INDEX "ledger_portfolio_time_idx" ON "portfolio_ledger_events" USING btree ("portfolio_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_tx_log_uq" ON "portfolio_ledger_events" USING btree ("tx_hash","log_index","asset_deployment_id");--> statement-breakpoint
CREATE INDEX "portfolios_user_idx" ON "portfolios" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "risk_events_strategy_idx" ON "risk_events" USING btree ("strategy_id");--> statement-breakpoint
CREATE INDEX "strategies_user_idx" ON "strategies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "strategies_next_eval_idx" ON "strategies" USING btree ("next_evaluation_at");--> statement-breakpoint
CREATE INDEX "authorizations_strategy_idx" ON "strategy_authorizations" USING btree ("strategy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evaluations_idempotency_uq" ON "strategy_evaluations" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "signals_strategy_idx" ON "strategy_signals" USING btree ("strategy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "strategy_versions_uq" ON "strategy_versions" USING btree ("strategy_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "executions_tx_uq" ON "executions" USING btree ("chain_id","tx_hash");--> statement-breakpoint
CREATE INDEX "executions_order_idx" ON "executions" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_uq" ON "trade_orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_user_state_idx" ON "trade_orders" USING btree ("user_id","state");--> statement-breakpoint
CREATE INDEX "proposals_strategy_state_idx" ON "trade_proposals" USING btree ("strategy_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "receipts_chain_tx_uq" ON "transaction_receipts" USING btree ("chain_id","tx_hash");--> statement-breakpoint
CREATE INDEX "audit_user_time_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id","read_at");