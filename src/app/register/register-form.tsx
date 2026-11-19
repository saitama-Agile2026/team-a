"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FormField } from "@/components/form-field";
import { isAllowedEmail } from "@/lib/email-check";
import {
  type FieldErrors,
  NICKNAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  registerSchema,
  toFieldErrors,
} from "@/lib/validation/auth";

const EMAIL_FORMAT_MESSAGE =
  "学内のメールアドレス（siw00〜siw45）を入力してください";

type Props = { allowedDomain: string };

// フロント側のチェックはUX向上のための即時エラー表示。
// 実際の制限はサーバー（/api/register）で必ず判定する。
export function RegisterForm({ allowedDomain }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailFormatError =
    emailTouched && email.trim() !== "" && !isAllowedEmail(email, allowedDomain)
      ? EMAIL_FORMAT_MESSAGE
      : undefined;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setEmailTouched(true);

    const formData = new FormData(event.currentTarget);
    const input = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
    };

    const parsed = registerSchema.safeParse(input);
    const errors: FieldErrors = parsed.success
      ? {}
      : toFieldErrors(parsed.error);
    if (!errors.email && !isAllowedEmail(input.email, allowedDomain)) {
      errors.email = EMAIL_FORMAT_MESSAGE;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (res.ok) {
        router.push("/login?registered=1");
        return;
      }
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        fieldErrors?: FieldErrors;
      } | null;
      setFieldErrors(body?.fieldErrors ?? {});
      setFormError(body?.error ?? "登録に失敗しました");
    } catch {
      setFormError("通信に失敗しました。時間をおいて再度お試しください");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <p
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </p>
      )}
      <FormField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
        placeholder={`siw01@${allowedDomain}`}
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setFieldErrors(({ email: _, ...rest }) => rest);
        }}
        onBlur={() => setEmailTouched(true)}
        error={emailFormatError ?? fieldErrors.email}
        required
      />
      <FormField
        label="パスワード"
        name="password"
        type="password"
        autoComplete="new-password"
        hint={`${PASSWORD_MIN_LENGTH}文字以上`}
        error={fieldErrors.password}
        required
      />
      <FormField
        label="ニックネーム"
        name="nickname"
        type="text"
        autoComplete="nickname"
        maxLength={NICKNAME_MAX_LENGTH}
        hint="他のユーザーに表示される名前です（メールアドレスは表示されません）"
        error={fieldErrors.nickname}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
