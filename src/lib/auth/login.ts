import "server-only";
import { normalizeEmail } from "@/lib/email-check";
import { type AuthenticatedUser, authenticateUser } from "./authenticate";
import { TooManyAttemptsError } from "./errors";
import {
  EMAIL_LIMIT,
  emailKey,
  getClientIp,
  IP_LIMIT,
  ipKey,
  isLocked,
  recordFailure,
  resetFailures,
} from "./rate-limit";

/**
 * レートリミット付きのログイン処理（Credentials Provider の authorize から呼ぶ）
 *
 * - ロック中なら照合せずに TooManyAttemptsError を投げる
 * - 失敗したらメール・IPの両方で失敗回数を記録（未登録メールでも記録し、存在有無を悟らせない）
 * - 成功したらメール単位の失敗回数をリセット
 */
export async function loginWithRateLimit(
  rawEmail: string,
  password: string,
  headers: Headers,
): Promise<AuthenticatedUser | null> {
  const eKey = emailKey(normalizeEmail(rawEmail));
  const ip = getClientIp(headers);
  const iKey = ip ? ipKey(ip) : null;

  if (await isLocked(iKey ? [eKey, iKey] : [eKey])) {
    throw new TooManyAttemptsError();
  }

  const user = await authenticateUser(rawEmail, password);
  if (!user) {
    await Promise.all([
      recordFailure(eKey, EMAIL_LIMIT),
      iKey ? recordFailure(iKey, IP_LIMIT) : undefined,
    ]);
    return null;
  }

  await resetFailures(eKey);
  return user;
}
