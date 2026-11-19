import { describe, expect, test } from "bun:test";
import { isAllowedEmail, normalizeEmail } from "./email-check";

const DOMAIN = "example.local";

describe("isAllowedEmail", () => {
  test.each([
    "siw01@example.local",
    "siw23010001@example.local",
    "siw23010009@example.local",
    "siw23010010@example.local",
    "siw23010039@example.local",
    "siw23010040@example.local",
    "siw24010001@example.local",
    "siw2501@example.local",
  ])("許可: %s", (email) => {
    expect(isAllowedEmail(email, DOMAIN)).toBe(true);
  });

  test("大文字・前後空白は正規化して許可する", () => {
    expect(isAllowedEmail("  SIW23010012@Example.LOCAL ", DOMAIN)).toBe(true);
  });

  test("許可ドメイン側の大文字も吸収する", () => {
    expect(isAllowedEmail("siw23010012@example.local", "Example.Local")).toBe(
      true,
    );
  });

  test.each([
    ["範囲外の番号(00)", "siw23010000@example.local"],
    ["範囲外の番号(41)", "siw23010041@example.local"],
    ["範囲外の番号(99)", "siw23010099@example.local"],
    ["接頭辞違い", "abc23010001@example.local"],
    ["接頭辞なし", "01@example.local"],
    ["数字部分に英字", "siwabc01@example.local"],
    ["余計な文字", "siw23010001a@example.local"],
    ["ドメイン違い", "siw23010001@gmail.com"],
    ["サブドメイン", "siw23010001@sub.example.local"],
    ["ドメイン末尾一致のみ", "siw23010001@evilexample.local"],
    ["@が2つ", "siw23010001@example.local@example.local"],
    ["@なし", "siw23010001example.local"],
    ["空文字", ""],
  ])("拒否: %s (%s)", (_label, email) => {
    expect(isAllowedEmail(email, DOMAIN)).toBe(false);
  });

  test("許可ドメインが空なら常に拒否する", () => {
    expect(isAllowedEmail("siw23010001@", "")).toBe(false);
    expect(isAllowedEmail("siw23010001@example.local", "")).toBe(false);
  });
});

describe("normalizeEmail", () => {
  test("前後空白を除去して小文字化する", () => {
    expect(normalizeEmail("  SIW23010001@Example.Local ")).toBe(
      "siw23010001@example.local",
    );
  });
});
