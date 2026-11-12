import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// 設計の全体像は documents/05_db_design.md を参照。

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const itemConditionEnum = pgEnum("item_condition", [
  "新品同様",
  "良好",
  "使用感あり",
  "傷・汚れあり",
  "ジャンク",
]);

export const itemStatusEnum = pgEnum("item_status", [
  "open",
  "matched",
  "completed",
  "closed",
]);

export const offerStatusEnum = pgEnum("offer_status", [
  "pending",
  "accepted",
  "declined",
]);

export const tradeStatusEnum = pgEnum("trade_status", [
  "matched",
  "completed",
  "cancelled",
]);

export const tradeCheckEnum = pgEnum("trade_check", [
  "pending",
  "ok",
  "unsatisfied",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  // 保存・比較の前に必ず小文字化する（アプリ側の責務）
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  role: roleEnum("role").notNull().default("user"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable(
  "items",
  {
    id: serial("id").primaryKey(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    condition: itemConditionEnum("condition").notNull(),
    wantedText: text("wanted_text"),
    wantedCategory: varchar("wanted_category", { length: 50 }),
    pickupNote: text("pickup_note"),
    status: itemStatusEnum("status").notNull().default("open"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("items_status_idx").on(table.status),
    index("items_category_idx").on(table.category),
  ],
);

export const itemImages = pgTable("item_images", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});
// 最大3枚の制限はDB制約ではなくAPI側でカウントして制御する

export const offers = pgTable(
  "offers",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 100 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    condition: itemConditionEnum("condition").notNull(),
    message: text("message"),
    status: offerStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("offers_item_status_idx").on(table.itemId, table.status),
    index("offers_requester_idx").on(table.requesterId),
  ],
);

export const offerImages = pgTable("offer_images", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id")
    .notNull()
    .references(() => offers.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("comments_item_created_idx").on(table.itemId, table.createdAt),
  ],
);

export const trades = pgTable(
  "trades",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id),
    offerId: integer("offer_id")
      .notNull()
      .references(() => offers.id)
      .unique(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id),
    requesterId: integer("requester_id")
      .notNull()
      .references(() => users.id),
    ownerCheck: tradeCheckEnum("owner_check").notNull().default("pending"),
    requesterCheck: tradeCheckEnum("requester_check")
      .notNull()
      .default("pending"),
    cancelReason: text("cancel_reason"),
    status: tradeStatusEnum("status").notNull().default("matched"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // 同じitemに対して進行中(matched)の取引は同時に1つまで（二重成立防止の安全網）
    uniqueIndex("trades_one_active_per_item_idx")
      .on(table.itemId)
      .where(sql`${table.status} = 'matched'`),
    index("trades_owner_idx").on(table.ownerId),
    index("trades_requester_idx").on(table.requesterId),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    tradeId: integer("trade_id")
      .notNull()
      .references(() => trades.id, { onDelete: "cascade" }),
    senderId: integer("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_trade_created_idx").on(table.tradeId, table.createdAt),
  ],
);
