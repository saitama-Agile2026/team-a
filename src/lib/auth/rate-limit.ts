import "server-only";
import { and, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

// ログイン試行回数制限
// 学籍番号は siw00〜siw45 と推測できるため、パスワード総当たりを防ぐ。
//
// - メールアドレス単位: 15分以内に5回連続で失敗したら15分ロック（ログイン成功でリセット）
// - IPアドレス単位: 複数アカウントへの総当たり（パスワードスプレー）対策。
//   学内Wi-Fiでは多くの学生が同じIPになるため、閾値は高めにしている。
//   成功してもリセットしない（自分のアカウントでのログインを挟んだ回避を防ぐ）

type Limit = {
  maxFailures: number;
  windowMinutes: number;
  lockMinutes: number;
};

export const EMAIL_LIMIT: Limit = {
  maxFailures: 5,
  windowMinutes: 15,
  lockMinutes: 15,
};
export const IP_LIMIT: Limit = {
  maxFailures: 30,
  windowMinutes: 15,
  lockMinutes: 15,
};

export const emailKey = (normalizedEmail: string) => `email:${normalizedEmail}`;
export const ipKey = (ip: string) => `ip:${ip}`;

/** いずれかのキーがロック中なら true */
export async function isLocked(keys: string[]): Promise<boolean> {
  if (keys.length === 0) return false;
  const rows = await db
    .select({ key: loginAttempts.key })
    .from(loginAttempts)
    .where(
      and(
        inArray(loginAttempts.key, keys),
        gt(loginAttempts.lockedUntil, sql`now()`),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** 失敗を1回記録し、上限に達したらロックする（1クエリで原子的に更新） */
export async function recordFailure(key: string, limit: Limit): Promise<void> {
  const window = sql.raw(`interval '${limit.windowMinutes} minutes'`);
  const lock = sql.raw(`interval '${limit.lockMinutes} minutes'`);
  // 前回の失敗から window 以上経過している、または前回のロックが明けている場合は 1 から数え直す
  const newCount = sql`case
    when ${loginAttempts.lastFailedAt} < now() - ${window}
      or ${loginAttempts.lockedUntil} <= now()
    then 1
    else ${loginAttempts.failedCount} + 1
  end`;

  await db
    .insert(loginAttempts)
    .values({ key, failedCount: 1 })
    .onConflictDoUpdate({
      target: loginAttempts.key,
      set: {
        failedCount: newCount,
        lastFailedAt: sql`now()`,
        lockedUntil: sql`case
          when ${newCount} >= ${limit.maxFailures} then now() + ${lock}
          when ${loginAttempts.lockedUntil} <= now() then null
          else ${loginAttempts.lockedUntil}
        end`,
      },
    });
}

/** ログイン成功時にメールアドレス単位の失敗回数をリセットする */
export async function resetFailures(key: string): Promise<void> {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, key));
}

/** リクエストからクライアントIPを取得する（Vercel は x-forwarded-for を設定する） */
export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || null;
}
