import type { Metadata } from "next";
import Link from "next/link";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { getAllowedEmailDomain } from "@/lib/allowed-domain";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "会員登録 | くるり",
};

export default function RegisterPage() {
  // ブラウザでは env を読めないため、即時チェック用にドメインを渡す
  const allowedDomain = getAllowedEmailDomain();

  return (
    <KururiShell>
      <div className="px-7 pt-[23px]">
        <BrandHeader />
      </div>

      {/* Hero Section */}
      <section className="px-7 pt-3 pb-2">
        <span className="inline-flex rounded-[20px] bg-[var(--soft)] px-2.5 py-[5px] text-[11px] font-extrabold text-[var(--accent)]">
          SIW MEMBERS ONLY
        </span>
        <h1 className="mt-[9px] mb-[6px] text-[27px] leading-[1.42] font-black tracking-[-0.05em] text-[var(--text)]">
          SIWの仲間と、
          <br />
          モノをつなごう。
        </h1>
        <p className="text-[13px] leading-[1.8] text-[var(--muted)]">
          SIWの在籍者向けサービスです。学校が認めたアカウント（siw...＋学籍番号01〜40@
          {allowedDomain}）のみ登録できます。
        </p>
      </section>

      {/* Register Form Panel */}
      <div className="px-7 pt-2 pb-6">
        <RegisterForm allowedDomain={allowedDomain} />

        <p className="mt-3 text-center text-[12px] text-[var(--muted)]">
          すでにアカウントをお持ちの方{" "}
          <Link
            href="/login"
            className="font-extrabold text-[var(--accent)] hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </KururiShell>
  );
}
