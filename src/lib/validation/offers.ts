import { z } from "zod";
import { createItemSchema } from "./items";

export const createOfferSchema = createItemSchema
  .pick({
    title: true,
    description: true,
    category: true,
    condition: true,
    imageKeys: true,
  })
  .extend({
    message: z
      .string()
      .trim()
      .min(1, "出品者へのメッセージを入力してください")
      .max(2000, "2000文字以内で入力してください"),
  });

type OfferItem = { ownerId: number; status: string; expiresAt: Date | null };

export function offerUnavailableReason(
  item: OfferItem,
  requesterId: number,
  now = new Date(),
): string | null {
  if (item.ownerId === requesterId) return "自分の出品には申し込めません";
  if (item.status !== "open")
    return "この出品は現在申し込みを受け付けていません";
  if (item.expiresAt && item.expiresAt <= now)
    return "この出品は公開期限が終了しています";
  return null;
}
