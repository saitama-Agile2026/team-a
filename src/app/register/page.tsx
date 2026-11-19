import type { Metadata } from "next";
import Link from "next/link";
import { getAllowedEmailDomain } from "@/lib/allowed-domain";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "会員登録 | SIW Swap",
};

export default function RegisterPage() {
  // ブラウザでは env を読めないため、即時チェック用にドメインを渡す
  const allowedDomain = getAllowedEmailDomain();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="mb-2 text-2xl font-bold">会員登録</h1>
      <p className="mb-8 text-sm text-gray-600">
        学内のメールアドレス（siw00〜siw45@{allowedDomain}）で登録できます。
      </p>
      <RegisterForm allowedDomain={allowedDomain} />
      <p className="mt-6 text-center text-sm">
        登録済みの方は{" "}
        <Link href="/login" className="text-blue-600 underline">
          ログイン
        </Link>
      </p>
    </main>
  );
}
