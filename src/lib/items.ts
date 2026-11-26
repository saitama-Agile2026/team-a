import "server-only";
import { and, desc, eq, gt, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { itemImages, items, users } from "@/db/schema";

import { containsPattern, type ItemSearch } from "./item-search";

export const ITEMS_PAGE_SIZE = 12;

export async function listItems(page: number, search?: ItemSearch) {
  return db
    .select({
      id: items.id,
      title: items.title,
      category: items.category,
      condition: items.condition,
      wantedText: items.wantedText,
      nickname: users.nickname,
      imageUrl: sql<
        string | null
      >`(select url from item_images where item_id = items.id order by sort_order, id limit 1)`,
    })
    .from(items)
    .innerJoin(users, eq(items.ownerId, users.id))
    .where(
      and(
        eq(items.status, "open"),
        search?.q
          ? or(
              ilike(items.title, containsPattern(search.q)),
              ilike(items.description, containsPattern(search.q)),
            )
          : undefined,
        search?.category ? eq(items.category, search.category) : undefined,
        search?.condition ? eq(items.condition, search.condition) : undefined,
        search?.wanted
          ? or(
              ilike(items.wantedText, containsPattern(search.wanted)),
              ilike(items.wantedCategory, containsPattern(search.wanted)),
            )
          : undefined,
        eq(users.isActive, true),
        or(isNull(items.expiresAt), gt(items.expiresAt, new Date())),
      ),
    )
    .orderBy(desc(items.createdAt), desc(items.id))
    .limit(ITEMS_PAGE_SIZE + 1)
    .offset((page - 1) * ITEMS_PAGE_SIZE);
}

export async function getItem(id: number) {
  const [item] = await db
    .select({
      id: items.id,
      ownerId: items.ownerId,
      title: items.title,
      description: items.description,
      category: items.category,
      condition: items.condition,
      wantedText: items.wantedText,
      wantedCategory: items.wantedCategory,
      pickupNote: items.pickupNote,
      status: items.status,
      expiresAt: items.expiresAt,
      nickname: users.nickname,
      imageUrl: sql<
        string | null
      >`(select url from item_images where item_id = items.id order by sort_order, id limit 1)`,
    })
    .from(items)
    .innerJoin(users, eq(items.ownerId, users.id))
    .where(and(eq(items.id, id), eq(users.isActive, true)))
    .limit(1);
  return item;
}

export async function getItemImages(itemId: number) {
  return db
    .select({ id: itemImages.id, url: itemImages.url })
    .from(itemImages)
    .where(eq(itemImages.itemId, itemId))
    .orderBy(itemImages.sortOrder, itemImages.id)
    .limit(3);
}
