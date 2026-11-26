import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { requireUser } from "@/lib/auth/authz";
import { logoutAction } from "./actions";
import { ProfileActions } from "./profile-actions";

export const metadata: Metadata = {
  title: "マイページ | くるり",
};

export default function MyPage() {
  return (
    <KururiShell>
      {/* セッションはリクエスト時に読むため Suspense の内側に置く（Cache Components） */}
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile />
      </Suspense>
    </KururiShell>
  );
}

async function Profile() {
  // proxy.ts の楽観的チェックに加え、DBの最新状態（無効化など）をここで確認する
  const user = await requireUser();

  return (
    <div className="pb-6">
      {/* Top Profile Banner */}
      <section className="bg-[var(--soft)] px-7 pt-[23px] pb-5">
        <BrandHeader variant="soft" />

        <h1 className="mt-6 mb-1.5 text-[23px] font-black tracking-[-0.04em] text-[var(--text)]">
          マイページ
        </h1>
        <p className="text-[12px] text-[var(--muted)]">
          あなたの交換活動をひと目でチェック
        </p>

        {/* Profile Row with Circular Avatar */}
        <div className="mt-[22px] flex items-center gap-3">
          {/* SIW くるり専用 完全円形アバター */}
          <div className="kururi-avatar" aria-hidden="true">
            🌷
          </div>
          <div className="min-w-0">
            <strong className="block truncate text-[16px] font-bold text-[var(--text)]">
              {user.nickname} さん
            </strong>
            <span className="block text-[11px] text-[var(--muted)]">
              SIWメンバー ・ 学内限定公開
            </span>
          </div>
          <form action={logoutAction} className="ml-auto shrink-0">
            <button
              type="submit"
              className="cursor-pointer whitespace-nowrap rounded-[12px] border border-[var(--line)] bg-[var(--input)] px-3 py-[9px] text-[11px] font-bold text-[var(--text)] transition-colors hover:bg-[var(--bg)]"
            >
              ログアウト
            </button>
          </form>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        aria-label="交換実績"
        className="mx-7 my-[18px] grid grid-cols-3 gap-px overflow-hidden rounded-[16px] border border-[var(--line)] bg-[var(--line)]"
      >
        <div className="bg-[var(--input)] px-0.5 py-[14px] text-center">
          <strong className="block text-[20px] font-extrabold text-[var(--text)]">
            12
          </strong>
          <span className="mt-[5px] block text-[10px] text-[var(--muted)]">
            出品したモノ
          </span>
        </div>
        <div className="bg-[var(--input)] px-0.5 py-[14px] text-center">
          <strong className="block text-[20px] font-extrabold text-[var(--text)]">
            8
          </strong>
          <span className="mt-[5px] block text-[10px] text-[var(--muted)]">
            交換成立
          </span>
        </div>
        <div className="bg-[var(--input)] px-0.5 py-[14px] text-center">
          <strong className="block text-[20px] font-extrabold text-[var(--text)]">
            4.9 ★
          </strong>
          <span className="mt-[5px] block text-[10px] text-[var(--muted)]">
            評価
          </span>
        </div>
      </section>

      {/* Items Showcase Section */}
      <section aria-labelledby="listed-items-heading">
        <div className="flex items-center justify-between px-7 pt-[5px] pb-[13px]">
          <h2
            id="listed-items-heading"
            className="text-[16px] font-bold text-[var(--text)]"
          >
            出品中のモノ
          </h2>
          <span className="text-[11px] font-extrabold text-[var(--accent)]">
            すべて見る ›
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 px-7">
          <article className="overflow-hidden rounded-[15px] border border-[var(--line)] bg-[var(--input)]">
            <div
              aria-hidden="true"
              className="grid h-[100px] place-items-center bg-[var(--soft)] text-[55px] leading-none"
            >
              📚
            </div>
            <div className="px-[11px] py-[10px]">
              <b className="block text-[12px] font-bold text-[var(--text)]">
                参考書セット
              </b>
              <span className="mt-[5px] block text-[10px] text-[var(--muted)]">
                交換募集中・状態良好
              </span>
            </div>
          </article>

          <article className="overflow-hidden rounded-[15px] border border-[var(--line)] bg-[var(--input)]">
            <div
              aria-hidden="true"
              className="grid h-[100px] place-items-center bg-[var(--soft)] text-[55px] leading-none"
            >
              ✏️
            </div>
            <div className="px-[11px] py-[10px]">
              <b className="block text-[12px] font-bold text-[var(--text)]">
                文房具セット
              </b>
              <span className="mt-[5px] block text-[10px] text-[var(--muted)]">
                交換募集中・未使用
              </span>
            </div>
          </article>
        </div>
      </section>

      {/* Action List */}
      <ProfileActions />

      {/* Account Info Details */}
      <section
        aria-labelledby="account-info-heading"
        className="mx-7 mt-5 rounded-[16px] border border-[var(--line)] bg-[var(--input)] p-4"
      >
        <h2
          id="account-info-heading"
          className="mb-3 text-[13px] font-bold text-[var(--text)]"
        >
          アカウント情報
        </h2>
        <dl className="grid grid-cols-[6.5rem_1fr] gap-y-2.5 text-[12px]">
          <dt className="text-[var(--muted)]">ニックネーム</dt>
          <dd className="font-semibold text-[var(--text)]">{user.nickname}</dd>
          <dt className="text-[var(--muted)]">メールアドレス</dt>
          <dd className="min-w-0 break-all font-semibold text-[var(--text)]">
            {user.email}
            <span className="mt-0.5 block text-[10px] font-normal text-[var(--muted)]">
              他のユーザーには表示されません
            </span>
          </dd>
        </dl>
      </section>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <section aria-busy="true" aria-label="読み込み中" className="pb-6">
      <div className="bg-[var(--soft)] px-7 pt-[23px] pb-5">
        <BrandHeader variant="soft" />
        <div className="mt-6 h-7 w-28 animate-pulse rounded-lg bg-[var(--line)]" />
        <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-[var(--line)]" />
        <div className="mt-[22px] flex items-center gap-3">
          <div className="kururi-avatar animate-pulse opacity-60" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-28 animate-pulse rounded bg-[var(--line)]" />
            <div className="h-3 w-36 animate-pulse rounded bg-[var(--line)]" />
          </div>
        </div>
      </div>
      <div className="mx-7 my-[18px] h-[72px] animate-pulse rounded-[16px] bg-[var(--soft)]/60" />
      <div className="grid grid-cols-2 gap-3 px-7">
        <div className="h-[156px] animate-pulse rounded-[15px] bg-[var(--soft)]/60" />
        <div className="h-[156px] animate-pulse rounded-[15px] bg-[var(--soft)]/60" />
      </div>
    </section>
  );
}
