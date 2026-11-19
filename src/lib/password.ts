import "server-only";
import bcrypt from "bcryptjs";

// パスワードは必ずこのモジュール経由でハッシュ化・照合する。
// 平文パスワードを DB に保存したり、ログに出したりしないこと。

const SALT_ROUNDS = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
