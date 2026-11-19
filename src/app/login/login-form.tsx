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
    <form action={formAction} noValidate className="flex flex-col gap-4">
      {registered && !state.error && (
        <p className="rounded border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
          登録が完了しました。ログインしてください。
        </p>
      )}
      {state.error && (
        <p
          className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      )}
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <FormField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="username"
        defaultValue={state.email}
        error={state.fieldErrors?.email}
        required
      />
      <FormField
        label="パスワード"
        name="password"
        type="password"
        autoComplete="current-password"
        error={state.fieldErrors?.password}
        required
      />
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
