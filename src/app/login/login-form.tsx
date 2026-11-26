"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { FormField } from "@/components/form-field";
import { type LoginState, loginAction } from "./actions";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "";
  const registered = searchParams.get("registered") === "1";

  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-[13px]">
      {registered && !state.error && (
        <p className="rounded-[12px] border border-green-300 bg-green-50 px-3.5 py-2.5 text-[12px] text-green-800">
          登録が完了しました。ログインしてください。
        </p>
      )}
      {state.error && (
        <p
          className="rounded-[12px] border border-red-300 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormField
        label="学校メールアドレス"
        name="email"
        type="email"
        placeholder="学校指定のメールアドレス"
        autoComplete="email"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        required
      />
      <FormField
        label="パスワード"
        name="password"
        type="password"
        placeholder="パスワードを入力"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-2 w-full cursor-pointer rounded-[13px] bg-[var(--accent)] py-[14px] text-center text-[14px] font-extrabold text-[var(--button-text)] transition-colors hover:bg-[var(--accent-hover)] active:scale-[0.99] disabled:opacity-50"
      >
        {pending ? "ログイン中..." : "ログインする"}
      </button>
    </form>
  );
}
