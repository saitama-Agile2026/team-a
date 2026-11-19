// ページの保護ルール（proxy.ts から参照）
// M2/M3/M4 で保護ページを追加するときは、ここにパスの先頭を追加する。

/** ログイン必須のパス（前方一致） */
export const PROTECTED_PREFIXES = ["/mypage"] as const;

/** 管理者（role = admin）のみのパス（前方一致）。M4で使う */
export const ADMIN_PREFIXES = ["/admin"] as const;

export const LOGIN_PATH = "/login";

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export type RouteAccess = "public" | "user" | "admin";

/** パスに必要な権限を返す */
export function getRouteAccess(pathname: string): RouteAccess {
  if (matchesPrefix(pathname, ADMIN_PREFIXES)) return "admin";
  if (matchesPrefix(pathname, PROTECTED_PREFIXES)) return "user";
  return "public";
}
