import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { normalizeEmail } from "@/lib/email-check";
import { verifyPassword } from "@/lib/password";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
};

// ユーザーが存在しない場合も同じだけ時間をかけ、応答時間からの
// メールアドレス存在確認（ユーザー列挙）をしにくくするためのダミーハッシュ
const DUMMY_HASH =
  "$2b$12$weAO/HYJV.rX7ZPFwRItqOa.5M3.IDvJjah3Xp2KADZBFgC.aRGWq";

/**
 * メール（小文字化して比較）＋パスワードで認証する。
 * 失敗時は理由を問わず null を返す（理由を呼び出し元に漏らさない）。
 */
export async function authenticateUser(
  rawEmail: string,
  password: string,
): Promise<AuthenticatedUser | null> {
  const email = normalizeEmail(rawEmail);

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      nickname: users.nickname,
      role: users.role,
      isActive: users.isActive,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordOk = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_HASH,
  );
  if (!user || !passwordOk) return null;

  // 管理者に無効化されたユーザーはログイン不可（M4の管理者機能の土台）
  if (!user.isActive) return null;

  return {
    id: String(user.id),
    email: user.email,
    name: user.nickname,
    role: user.role,
  };
}
