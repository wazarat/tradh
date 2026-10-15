import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { notificationKindEnum } from "./enums";
import { users } from "./identity";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: notificationKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    payload: jsonb("payload"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_unread_idx").on(t.userId, t.readAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    actor: text("actor").notNull(), // "user" | "system" | "mcp" | "worker"
    action: text("action").notNull(),
    subjectType: text("subject_type"),
    subjectId: text("subject_id"),
    detail: jsonb("detail"),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_user_time_idx").on(t.userId, t.createdAt)],
);
