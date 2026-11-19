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
    ["/admin", "admin"],
    ["/admin/users", "admin"],
    ["/administrator", "public"],
  ] as const)("%s -> %s", (path, expected) => {
    expect(getRouteAccess(path)).toBe(expected);
  });
});
