import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ログイン | くるり",
};

export default function LoginPage() {
  return (
    <KururiShell>
      <div className="px-7 pt-[23px]">
        <BrandHeader />
      </div>

      {/* Hero Section */}
      <section className="px-7 pt-7 pb-3">
        <div className="text-[11px] font-black tracking-[0.15em] text-[var(--accent)]">
          SIW STUDENTS &amp; STAFF ONLY
        </div>
        <h1 className="mt-[13px] mb-[11px] text-[31px] leading-[1.42] font-black tracking-[-0.05em] text-[var(--text)]">
          使わなくなったモノに、
          <br />
          次の物語を。
        </h1>
        <p className="text-[13px] leading-[1.8] text-[var(--muted)]">
          SIWの仲間と、教科書や日用品を交換しよう。
        </p>
      </section>

      {/* Illustration Box */}
      <div
        aria-hidden="true"
        className="kururi-illustration mx-[26px] mt-2 mb-[13px] flex h-[134px] items-center justify-center gap-4 overflow-hidden"
      >
        <span className="-rotate-9 text-[54px] leading-none drop-shadow-[0_7px_2px_rgba(0,0,0,0.07)]">
          📚
        </span>
        <span className="text-[26px] font-black text-[var(--accent)]">⇄</span>
        <span className="rotate-9 text-[54px] leading-none drop-shadow-[0_7px_2px_rgba(0,0,0,0.07)]">
          🎧
        </span>
      </div>

      {/* Login Form Panel */}
      <div className="px-7 pt-[18px] pb-6">
        {/* useSearchParams を使うため Suspense で囲む（Cache Components 対応） */}
        <Suspense>
          <LoginForm />
        </Suspense>

        <p className="my-4 rounded-[10px] bg-[var(--soft)] px-3 py-2.5 text-[11px] leading-[1.7] text-[var(--muted)]">
          🔒 SIW関係者のみ利用できます。ゲスト閲覧には対応していません。
        </p>

        <p className="mt-[19px] text-center text-[12px] text-[var(--muted)]">
          アカウントをお持ちでない方は{" "}
          <Link
            href="/register"
            className="font-extrabold text-[var(--accent)] hover:underline"
          >
            新規登録
          </Link>
        </p>
      </div>
    </KururiShell>
  );
}
