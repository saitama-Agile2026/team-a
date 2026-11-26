import { z } from "zod";
import { ITEM_CONDITIONS, itemPageSchema } from "./validation/items";

export const itemSearchSchema = z.object({
  page: itemPageSchema.default(1),
  q: z.string().trim().max(100, "キーワードは100文字以内です").default(""),
  category: z.string().trim().max(50, "カテゴリは50文字以内です").default(""),
  condition: z.union([z.literal(""), z.enum(ITEM_CONDITIONS)]).default(""),
  wanted: z.string().trim().max(100, "欲しい物は100文字以内です").default(""),
});
export type ItemSearch = z.infer<typeof itemSearchSchema>;

/** LIKEのワイルドカードを文字として検索する。 */
export function containsPattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

export function itemSearchHref(search: ItemSearch, page: number): string {
  const params = new URLSearchParams();
  for (const key of ["q", "category", "condition", "wanted"] as const) {
    if (search[key]) params.set(key, search[key]);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/items?${query}` : "/items";
}
