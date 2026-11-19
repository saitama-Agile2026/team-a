import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ログイン | SIW Swap",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">ログイン</h1>
      {/* useSearchParams を使うため Suspense で囲む（Cache Components 対応） */}
      <Suspense>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm">
        アカウントをお持ちでない方は{" "}
        <Link href="/register" className="text-blue-600 underline">
          会員登録
        </Link>
      </p>
    </main>
  );
}
