import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  displayName: text("display_name"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    address: text("address").notNull(), // lowercase 0x…
    chainId: integer("chain_id").notNull(),
    label: text("label"),
    isPrimary: boolean("is_primary").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("wallets_address_chain_uq").on(t.address, t.chainId), index("wallets_user_idx").on(t.userId)],
);

/** SIWE sessions. The cookie carries only the opaque session id. */
export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // random 32-byte base64url
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    walletAddress: text("wallet_address").notNull(),
    chainId: integer("chain_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [index("sessions_user_idx").on(t.userId), index("sessions_expires_idx").on(t.expiresAt)],
);

/** One-time SIWE nonces, consumed on verify. */
export const siweNonces = pgTable("siwe_nonces", {
  nonce: text("nonce").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});
