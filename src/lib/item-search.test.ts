import { describe, expect, test } from "bun:test";
import {
  containsPattern,
  itemSearchHref,
  itemSearchSchema,
} from "./item-search";

describe("出品検索", () => {
  test("条件なしは一覧の既存動作を維持する", () => {
    expect(itemSearchSchema.parse({})).toEqual({
      page: 1,
      q: "",
      category: "",
      condition: "",
      wanted: "",
    });
  });
  test("前後空白を除去し、ページと状態を検証する", () => {
    expect(itemSearchSchema.parse({ q: " 教科書 ", page: "2" }).q).toBe(
      "教科書",
    );
    for (const input of [
      { page: "0" },
      { page: "1.5" },
      { condition: "未定義" },
      { q: "a".repeat(101) },
      { category: "a".repeat(51) },
      { wanted: "a".repeat(101) },
      { q: ["a", "b"] },
    ])
      expect(itemSearchSchema.safeParse(input).success).toBe(false);
  });
  test("LIKEの特殊文字を文字として検索する", () => {
    expect(containsPattern("100%_a")).toBe("%100\\%\\_a%");
    expect(containsPattern("a\\b")).toBe("%a\\\\b%");
    expect(containsPattern("教科書")).toBe("%教科書%");
  });
  test("ページを切り替えても日本語と特殊文字を含む条件を維持する", () => {
    const search = itemSearchSchema.parse({
      q: "C++ & SQL",
      category: "教科書",
      condition: "良好",
      wanted: "本",
      page: 2,
    });
    const url = new URL(itemSearchHref(search, 3), "http://localhost");
    expect(url.searchParams.get("q")).toBe("C++ & SQL");
    expect(url.searchParams.get("category")).toBe("教科書");
    expect(url.searchParams.get("condition")).toBe("良好");
    expect(url.searchParams.get("wanted")).toBe("本");
    expect(url.searchParams.get("page")).toBe("3");
    expect(
      new URL(itemSearchHref(search, 1), "http://localhost").searchParams.has(
        "page",
      ),
    ).toBe(false);
    expect(itemSearchHref(itemSearchSchema.parse({}), 1)).toBe("/items");
  });
});
