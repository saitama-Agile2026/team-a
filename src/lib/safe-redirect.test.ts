import { describe, expect, test } from "bun:test";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  test.each(["/mypage", "/items/1?tab=offers", "/"])("許可: %s", (path) => {
    expect(safeRedirectPath(path)).toBe(path);
  });

  test.each([
    "",
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com",
    "javascript:alert(1)",
    "mypage",
  ])("拒否してfallback: %s", (path) => {
    expect(safeRedirectPath(path)).toBe("/mypage");
  });

  test("null/undefined は fallback", () => {
    expect(safeRedirectPath(null)).toBe("/mypage");
    expect(safeRedirectPath(undefined, "/")).toBe("/");
  });
});
