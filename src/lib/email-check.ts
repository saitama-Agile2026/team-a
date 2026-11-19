// 学内メール形式チェック（フロント・サーバー共通）
//
// - フロント: 登録フォームでの即時エラー表示（UX向上目的。信用しない）
// - サーバー: 会員登録APIでの必須チェック（実際の制限はこちらで担保する）
//
// ブラウザでは process.env.ALLOWED_EMAIL_DOMAIN を参照できないため、
// ドメインは引数で受け取る。サーバー側は getAllowedEmailDomain() で取得して渡す。

/** ローカルパート: `siw` + 任意の数字（入学年度など） + 学籍番号 `01`〜`40` */
const ID_PATTERN = /^siw\d*(0[1-9]|[1-3][0-9]|40)$/;

/** 比較・保存用にメールアドレスを正規化する（前後空白除去＋小文字化） */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 学内メール形式（siw + 任意の数字 + 01〜40 @ 許可ドメイン）かどうかを判定する */
export function isAllowedEmail(email: string, allowedDomain: string): boolean {
  const domainToMatch = normalizeEmail(allowedDomain);
  if (!domainToMatch) return false;

  const parts = normalizeEmail(email).split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  return domain === domainToMatch && ID_PATTERN.test(local);
}
