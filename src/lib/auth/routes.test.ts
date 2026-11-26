import { describe, expect, test } from "bun:test";
import { getRouteAccess } from "./routes";

describe("getRouteAccess", () => {
  test.each([
    ["/", "public"],
    ["/login", "public"],
    ["/register", "public"],
    ["/mypage", "user"],
    ["/mypage/settings", "user"],
    ["/mypageX", "public"],
    ["/items", "user"],
    ["/items/new", "user"],
    ["/items/42", "user"],
    ["/itemsX", "public"],
    ["/admin", "admin"],
    ["/admin/users", "admin"],
    ["/administrator", "public"],
  ] as const)("%s -> %s", (path, expected) => {
    expect(getRouteAccess(path)).toBe(expected);
  });
});
