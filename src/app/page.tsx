import Link from "next/link";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";

export default function Home() {
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
          SIWの仲間と、教科書や日用品を手渡しで交換しよう。
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

      {/* Actions */}
      <div className="flex flex-1 flex-col justify-between px-7 pt-[18px] pb-6">
        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="block w-full rounded-[13px] bg-[var(--accent)] py-[14px] text-center text-[14px] font-extrabold text-[var(--button-text)] transition-colors hover:bg-[var(--accent-hover)]"
          >
            ログインしてはじめる
          </Link>
          <Link
            href="/register"
            className="block w-full rounded-[12px] border border-[var(--line)] bg-[var(--input)] py-3 text-center text-[13px] font-bold text-[var(--text)] transition-colors hover:bg-[var(--soft)]"
          >
            SIWアカウントを新規登録
          </Link>
          <p className="my-2 rounded-[10px] bg-[var(--soft)] px-3 py-2.5 text-[11px] leading-[1.7] text-[var(--muted)]">
            🔒 SIW関係者のみ利用できます。ゲスト閲覧には対応していません。
          </p>
        </div>

        <p className="mt-4 text-center text-[12px] text-[var(--muted)]">
          ログイン済みの方は{" "}
          <Link
            href="/mypage"
            className="font-extrabold text-[var(--accent)] hover:underline"
          >
            マイページへ
          </Link>
        </p>
      </div>
    </KururiShell>
  );
}
