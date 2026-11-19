import "server-only";

/** サーバー側で許可ドメインを取得する。未設定なら起動ミスなので例外にする */
export function getAllowedEmailDomain(): string {
  const domain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (!domain) {
    throw new Error("ALLOWED_EMAIL_DOMAIN is not set");
  }
  return domain;
}
