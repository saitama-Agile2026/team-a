import "server-only";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { LOGIN_PATH } from "./routes";

// サーバー側の認可ヘルパー（ページ・Server Action・Route Handler で使う）
//
// proxy.ts はセッション(JWT)だけを見る楽観的チェックなので、
// 実際のデータ操作の前には必ずここの関数でDBの最新状態を確認する。
// （JWTは管理者が無効化した後も有効期限まで残るため）

export type Role = "user" | "admin";

export type CurrentUser = {
  id: number;
  email: string;
  nickname: string;
  role: Role;
};

/** ログイン中かつ有効なユーザーを返す。未ログイン・無効化済みなら null */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id)) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      isActive: users.isActive,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user || !user.isActive) return null;
  const { isActive: _, ...currentUser } = user;
  return currentUser;
}

/** role 判定（M3/M4 の権限チェックの土台） */
export function hasRole(user: Pick<CurrentUser, "role">, role: Role): boolean {
  if (role === "user") return true; // admin は user の権限も持つ
  return user.role === role;
}

/** ページ・Server Action 用: 未ログインならログイン画面へリダイレクト */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

/** ページ・Server Action 用: 管理者以外には存在を見せない（404） */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasRole(user, "admin")) notFound();
  return user;
}
