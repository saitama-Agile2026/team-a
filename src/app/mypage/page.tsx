import type { Metadata } from "next";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth/authz";
import { logoutAction } from "./actions";

export const metadata: Metadata = {
  title: "マイページ | SIW Swap",
};

// マイページ雛形（ログイン中のユーザー情報のみ）
// 出品一覧・送った要望などは M2/M3 で追加する。
export default function MyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
      <h1 className="mb-8 text-2xl font-bold">マイページ</h1>
      {/* セッションはリクエスト時に読むため Suspense の内側に置く（Cache Components） */}
      <Suspense fallback={<ProfileSkeleton />}>
        <Profile />
      </Suspense>
    </main>
  );
}

async function Profile() {
  // proxy.ts の楽観的チェックに加え、DBの最新状態（無効化など）をここで確認する
  const user = await requireUser();

  return (
    <section className="rounded border border-gray-200 p-6">
      <h2 className="mb-4 text-lg font-semibold">アカウント情報</h2>
      <dl className="grid grid-cols-[8rem_1fr] gap-y-3 text-sm">
        <dt className="text-gray-500">ニックネーム</dt>
        <dd>{user.nickname}</dd>
        <dt className="text-gray-500">メールアドレス</dt>
        <dd>
          {user.email}
          <span className="ml-2 text-xs text-gray-500">
            （他のユーザーには表示されません）
          </span>
        </dd>
      </dl>
      <form action={logoutAction} className="mt-6">
        <button
          type="submit"
          className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          ログアウト
        </button>
      </form>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <section
      className="h-44 animate-pulse rounded border border-gray-200 bg-gray-50"
      aria-busy="true"
      aria-label="読み込み中"
    />
  );
}
