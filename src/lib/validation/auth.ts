import { z } from "zod";

// 認証まわりの入力スキーマ（フロント・サーバー共通）
// 学内メール形式の判定は src/lib/email-check.ts（許可ドメインが必要なため別関数）

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt は先頭72バイトまでしか使わないため、それを超える入力は受け付けない
export const PASSWORD_MAX_BYTES = 72;
export const NICKNAME_MAX_LENGTH = 50;
export const EMAIL_MAX_LENGTH = 255;

const emailField = z
  .string({ error: "メールアドレスを入力してください" })
  .trim()
  .min(1, "メールアドレスを入力してください")
  .max(EMAIL_MAX_LENGTH, "メールアドレスが長すぎます");

export const registerSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "パスワードを入力してください" })
    .min(
      PASSWORD_MIN_LENGTH,
      `パスワードは${PASSWORD_MIN_LENGTH}文字以上で入力してください`,
    )
    .refine(
      (v) => new TextEncoder().encode(v).length <= PASSWORD_MAX_BYTES,
      `パスワードが長すぎます（半角${PASSWORD_MAX_BYTES}文字以内）`,
    ),
  nickname: z
    .string({ error: "ニックネームを入力してください" })
    .trim()
    .min(1, "ニックネームを入力してください")
    .max(
      NICKNAME_MAX_LENGTH,
      `ニックネームは${NICKNAME_MAX_LENGTH}文字以内で入力してください`,
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "パスワードを入力してください" })
    .min(1, "パスワードを入力してください")
    .refine(
      (v) => new TextEncoder().encode(v).length <= PASSWORD_MAX_BYTES,
      "パスワードが長すぎます",
    ),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** フォーム項目ごとのエラーメッセージ（API・画面で共通の形） */
export type FieldErrors = Record<string, string>;

/** zodのエラーを「項目名 → 最初のメッセージ」の形に変換する */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] ??= issue.message;
  }
  return result;
}
