import { describe, expect, test } from "bun:test";
import { createOfferSchema, offerUnavailableReason } from "./offers";

const input = {
  title: "参考書",
  description: "書き込みあり",
  category: "本",
  condition: "良好",
  message: "この本との交換を希望します",
};
describe("交換の要望", () => {
  test("自分の出品がなくても物の情報で申し込める", () => {
    const result = createOfferSchema.parse(input);
    expect(result.imageKeys).toEqual([]);
    expect(result.message).toBe(input.message);
    expect(result).not.toHaveProperty("itemId");
  });
  test("送信者・状態の指定を受け付けない", () => {
    const result = createOfferSchema.parse({
      ...input,
      requesterId: 99,
      status: "accepted",
    });
    expect(result).not.toHaveProperty("requesterId");
    expect(result).not.toHaveProperty("status");
  });
  test("必須項目・メッセージの上限・画像枚数を検証する", () => {
    for (const invalid of [
      { title: "" },
      { message: " " },
      { message: "a".repeat(2001) },
      { condition: "不正" },
      { imageKeys: ["a", "b", "c", "d"] },
    ]) {
      expect(
        createOfferSchema.safeParse({ ...input, ...invalid }).success,
      ).toBe(false);
    }
  });
  test("自分の出品、公開終了、成立済み、期限切れを拒否する", () => {
    const now = new Date("2026-11-26T00:00:00Z");
    const item = { ownerId: 1, status: "open", expiresAt: null };
    expect(offerUnavailableReason(item, 2, now)).toBeNull();
    expect(offerUnavailableReason(item, 1, now)).not.toBeNull();
    for (const status of ["matched", "completed", "closed"]) {
      expect(
        offerUnavailableReason({ ...item, status }, 2, now),
      ).not.toBeNull();
    }
    expect(
      offerUnavailableReason({ ...item, expiresAt: now }, 2, now),
    ).not.toBeNull();
    expect(
      offerUnavailableReason(
        { ...item, expiresAt: new Date(now.getTime() + 1) },
        2,
        now,
      ),
    ).toBeNull();
  });
});
