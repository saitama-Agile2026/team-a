CREATE TYPE "public"."item_condition" AS ENUM('新品同様', '良好', '使用感あり', '傷・汚れあり', 'ジャンク');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('open', 'matched', 'completed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."trade_check" AS ENUM('pending', 'ok', 'unsatisfied');--> statement-breakpoint
CREATE TYPE "public"."trade_status" AS ENUM('matched', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "item_images" DROP CONSTRAINT "item_images_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_trade_id_trades_id_fk";
--> statement-breakpoint
ALTER TABLE "offer_images" DROP CONSTRAINT "offer_images_offer_id_offers_id_fk";
--> statement-breakpoint
ALTER TABLE "offers" DROP CONSTRAINT "offers_item_id_items_id_fk";
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "condition" SET DATA TYPE "public"."item_condition" USING "condition"::"public"."item_condition";--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."item_status";--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "status" SET DATA TYPE "public"."item_status" USING "status"::"public"."item_status";--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "condition" SET DATA TYPE "public"."item_condition" USING "condition"::"public"."item_condition";--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."offer_status";--> statement-breakpoint
ALTER TABLE "offers" ALTER COLUMN "status" SET DATA TYPE "public"."offer_status" USING "status"::"public"."offer_status";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "owner_check" SET DEFAULT 'pending'::"public"."trade_check";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "owner_check" SET DATA TYPE "public"."trade_check" USING "owner_check"::"public"."trade_check";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "owner_check" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "requester_check" SET DEFAULT 'pending'::"public"."trade_check";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "requester_check" SET DATA TYPE "public"."trade_check" USING "requester_check"::"public"."trade_check";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "requester_check" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "status" SET DEFAULT 'matched'::"public"."trade_status";--> statement-breakpoint
ALTER TABLE "trades" ALTER COLUMN "status" SET DATA TYPE "public"."trade_status" USING "status"::"public"."trade_status";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "trades" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_trade_id_trades_id_fk" FOREIGN KEY ("trade_id") REFERENCES "public"."trades"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_images" ADD CONSTRAINT "offer_images_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_item_created_idx" ON "comments" USING btree ("item_id","created_at");--> statement-breakpoint
CREATE INDEX "items_status_idx" ON "items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "items_category_idx" ON "items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "messages_trade_created_idx" ON "messages" USING btree ("trade_id","created_at");--> statement-breakpoint
CREATE INDEX "offers_item_status_idx" ON "offers" USING btree ("item_id","status");--> statement-breakpoint
CREATE INDEX "offers_requester_idx" ON "offers" USING btree ("requester_id");--> statement-breakpoint
CREATE UNIQUE INDEX "trades_one_active_per_item_idx" ON "trades" USING btree ("item_id") WHERE "trades"."status" = 'matched';--> statement-breakpoint
CREATE INDEX "trades_owner_idx" ON "trades" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "trades_requester_idx" ON "trades" USING btree ("requester_id");--> statement-breakpoint
ALTER TABLE "trades" ADD CONSTRAINT "trades_offer_id_unique" UNIQUE("offer_id");