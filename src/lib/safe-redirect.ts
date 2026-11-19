/**
 * ログイン後の遷移先として安全なパスかを確認し、だめなら fallback を返す。
 * 外部サイトへのオープンリダイレクトを防ぐため、同一オリジン内の相対パスのみ許可する。
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/mypage",
): string {
  if (!value) return fallback;
  // "/" 始まりのみ許可。"//evil.com" や "/\evil.com" はプロトコル相対URLになるので拒否
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}
