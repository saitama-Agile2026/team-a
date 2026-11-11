import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// 01_proposal.md の「テーブル案」を初期スキーマ化したもの。
// status系カラムはM1〜M3の実装時に値が決まり次第pgEnumへの置き換えを検討する。

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  nickname: varchar("nickname", { length: 50 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"), // user | admin
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 20 }).notNull(), // 新品同様|良好|使用感あり|傷・汚れあり|ジャンク
  wantedText: text("wanted_text"),
  wantedCategory: varchar("wanted_category", { length: 50 }),
  pickupNote: text("pickup_note"),
  status: varchar("status", { length: 20 }).notNull().default("open"), // open|matched|completed|closed
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const itemImages = pgTable("item_images", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  requesterId: integer("requester_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 20 }).notNull(),
  message: text("message"),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending|accepted|declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const offerImages = pgTable("offer_images", {
  id: serial("id").primaryKey(),
  offerId: integer("offer_id")
    .notNull()
    .references(() => offers.id),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id),
  offerId: integer("offer_id")
    .notNull()
    .references(() => offers.id),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id),
  requesterId: integer("requester_id")
    .notNull()
    .references(() => users.id),
  ownerCheck: varchar("owner_check", { length: 20 }), // ok|unsatisfied
  requesterCheck: varchar("requester_check", { length: 20 }),
  cancelReason: text("cancel_reason"),
  status: varchar("status", { length: 20 }).notNull().default("matched"), // matched|completed|cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  tradeId: integer("trade_id")
    .notNull()
    .references(() => trades.id),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
