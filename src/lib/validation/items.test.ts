import { describe, expect, test } from "bun:test";
import { createItemSchema, itemPageSchema } from "./items";

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
