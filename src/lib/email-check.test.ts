import { describe, expect, test } from "bun:test";
import { isAllowedEmail, normalizeEmail } from "./email-check";

const DOMAIN = "example.local";

describe("isAllowedEmail", () => {
  test.each([
    "siw00@example.local",
    "siw01@example.local",
    "siw09@example.local",
    "siw10@example.local",
    "siw39@example.local",
    "siw40@example.local",
    "siw45@example.local",
  ])("許可: %s", (email) => {
    expect(isAllowedEmail(email, DOMAIN)).toBe(true);
  });

  test("大文字・前後空白は正規化して許可する", () => {
    expect(isAllowedEmail("  SIW12@Example.LOCAL ", DOMAIN)).toBe(true);
  });

  test("許可ドメイン側の大文字も吸収する", () => {
    expect(isAllowedEmail("siw12@example.local", "Example.Local")).toBe(true);
  });

  test.each([
    ["範囲外の番号", "siw46@example.local"],
    ["範囲外の番号(99)", "siw99@example.local"],
    ["1桁", "siw1@example.local"],
    ["3桁", "siw001@example.local"],
    ["接頭辞違い", "abc01@example.local"],
    ["接頭辞なし", "01@example.local"],
    ["余計な文字", "siw01a@example.local"],
    ["ドメイン違い", "siw01@gmail.com"],
    ["サブドメイン", "siw01@sub.example.local"],
    ["ドメイン末尾一致のみ", "siw01@evilexample.local"],
    ["@が2つ", "siw01@example.local@example.local"],
    ["@なし", "siw01example.local"],
    ["空文字", ""],
  ])("拒否: %s (%s)", (_label, email) => {
    expect(isAllowedEmail(email, DOMAIN)).toBe(false);
  });

  test("許可ドメインが空なら常に拒否する", () => {
    expect(isAllowedEmail("siw01@", "")).toBe(false);
    expect(isAllowedEmail("siw01@example.local", "")).toBe(false);
  });
});

describe("normalizeEmail", () => {
  test("前後空白を除去して小文字化する", () => {
    expect(normalizeEmail("  SIW01@Example.Local ")).toBe(
      "siw01@example.local",
    );
  });
});
