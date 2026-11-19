import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { getRouteAccess, LOGIN_PATH } from "@/lib/auth/routes";

// 認可ミドルウェア（Next.js 16 では middleware.ts → proxy.ts）
//
// ここで行うのはセッション(JWT)を見るだけの「楽観的チェック」。
// 無効化済みユーザーの判定などDBを見る確認は、各ページ・Server Action・Route Handler で
// src/lib/auth/authz.ts の requireUser / requireAdmin を必ず呼んで行うこと。
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const access = getRouteAccess(pathname);
  if (access === "public") return NextResponse.next();

  const user = req.auth?.user;
  if (!user) {
    const loginUrl = new URL(LOGIN_PATH, req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (access === "admin" && user.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  // APIと静的ファイルを除くすべてのページで実行し、保護対象かは routes.ts で判定する
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads/).*)"],
};
