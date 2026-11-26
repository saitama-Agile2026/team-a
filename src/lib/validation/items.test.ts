import { describe, expect, test } from "bun:test";
import { createItemSchema, isOwnedImageKey, itemPageSchema } from "./items";

const input = {
  title: " 教科書 ",
  description: "書き込みがあります",
  category: "本",
  condition: "良好",
};

describe("createItemSchema", () => {
  test("入力を正規化し、任意項目を省略できる", () => {
    const parsed = createItemSchema.parse(input);
    expect(parsed.title).toBe("教科書");
    expect(parsed.wantedText).toBe("");
    expect(parsed.pickupNote).toBe("");
  });
  test("クライアントから渡された所有者と状態は採用しない", () => {
    const parsed = createItemSchema.parse({
      ...input,
      ownerId: 999,
      status: "completed",
    });
    expect(parsed).not.toHaveProperty("ownerId");
    expect(parsed).not.toHaveProperty("status");
  });
  test.each([
    { title: " " },
    { title: "a".repeat(101) },
    { description: "" },
    { description: "a".repeat(5001) },
    { category: "" },
    { category: "a".repeat(51) },
    { condition: "未定義" },
    { wantedCategory: "a".repeat(51) },
    { wantedText: "a".repeat(2001) },
    { pickupNote: "a".repeat(1001) },
  ])("不正な項目を拒否する", (invalid) => {
    expect(createItemSchema.safeParse({ ...input, ...invalid }).success).toBe(
      false,
    );
  });
});

describe("itemPageSchema", () => {
  test("ページ番号の有効範囲を検証する", () => {
    expect(itemPageSchema.parse("2")).toBe(2);
    for (const value of ["0", "-1", "1.5", "abc", "10001", ["1", "2"]]) {
      expect(itemPageSchema.safeParse(value).success).toBe(false);
    }
  });
});

describe("出品画像", () => {
  const key = "uploads/9/12345678-1234-4123-8123-123456789abc.webp";
  test("画像なしの既存リクエストも受け付ける", () => {
    expect(createItemSchema.parse(input).imageKeys).toEqual([]);
  });
  test("画像は3枚まで、同じキーを重複させない", () => {
    expect(
      createItemSchema.safeParse({ ...input, imageKeys: [key] }).success,
    ).toBe(true);
    expect(
      createItemSchema.safeParse({ ...input, imageKeys: [key, key] }).success,
    ).toBe(false);
    expect(
      createItemSchema.safeParse({ ...input, imageKeys: ["a", "b", "c", "d"] })
        .success,
    ).toBe(false);
  });
  test("自分のアップロードキーだけを認める", () => {
    expect(isOwnedImageKey(9, key)).toBe(true);
    expect(isOwnedImageKey(8, key)).toBe(false);
    expect(isOwnedImageKey(9, key.replace("/9/", "/90/"))).toBe(false);
    expect(isOwnedImageKey(9, "uploads/9/../8/image.webp")).toBe(false);
    expect(isOwnedImageKey(9, "https://other.example/image.webp")).toBe(false);
    expect(isOwnedImageKey(9, `${key}?extra=1`)).toBe(false);
  });
});
