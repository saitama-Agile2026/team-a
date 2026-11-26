import { z } from "zod";

export const ITEM_CONDITIONS = [
  "新品同様",
  "良好",
  "使用感あり",
  "傷・汚れあり",
  "ジャンク",
] as const;

export const createItemSchema = z.object({
  imageKeys: z
    .array(z.string().max(200))
    .max(3, "画像は3枚までです")
    .refine(
      (keys) => new Set(keys).size === keys.length,
      "同じ画像を重複して指定できません",
    )
    .default([]),
  title: z
    .string()
    .trim()
    .min(1, "タイトルを入力してください")
    .max(100, "100文字以内で入力してください"),
  description: z
    .string()
    .trim()
    .min(1, "説明を入力してください")
    .max(5000, "5000文字以内で入力してください"),
  category: z
    .string()
    .trim()
    .min(1, "カテゴリを入力してください")
    .max(50, "50文字以内で入力してください"),
  condition: z.enum(ITEM_CONDITIONS, { error: "商品の状態を選んでください" }),
  wantedCategory: z
    .string()
    .trim()
    .max(50, "50文字以内で入力してください")
    .default(""),
  wantedText: z
    .string()
    .trim()
    .max(2000, "2000文字以内で入力してください")
    .default(""),
  pickupNote: z
    .string()
    .trim()
    .max(1000, "1000文字以内で入力してください")
    .default(""),
});

export const itemPageSchema = z.coerce.number().int().min(1).max(10000);

export function isOwnedImageKey(ownerId: number, key: string): boolean {
  return (
    key.startsWith(`uploads/${ownerId}/`) &&
    /^uploads\/[1-9]\d*\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.webp$/.test(
      key,
    )
  );
}
