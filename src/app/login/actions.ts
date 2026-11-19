"use server";

import { AuthError, CredentialsSignin } from "next-auth";
import { signIn } from "@/auth";
import { RATE_LIMITED_CODE } from "@/lib/auth/errors";
import { EMAIL_LIMIT } from "@/lib/auth/rate-limit";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { loginSchema, toFieldErrors } from "@/lib/validation/auth";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectPath(
    String(formData.get("callbackUrl") ?? ""),
  );

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error), email };
  }

  try {
    // 成功時は redirectTo へリダイレクトする（内部的に例外を投げるので catch で握りつぶさない）
    await signIn("credentials", { ...parsed.data, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: loginErrorMessage(error), email };
    }
    throw error;
  }
}

function loginErrorMessage(error: AuthError): string {
  if (error instanceof CredentialsSignin && error.code === RATE_LIMITED_CODE) {
    return `ログイン試行回数の上限に達しました。${EMAIL_LIMIT.lockMinutes}分ほど待ってから再度お試しください`;
  }
  if (error.type === "CredentialsSignin") {
    // どちらが間違っているかは教えない（アカウント存在確認の防止）
    return "メールアドレスまたはパスワードが正しくありません";
  }
  return "ログインに失敗しました。時間をおいて再度お試しください";
}
