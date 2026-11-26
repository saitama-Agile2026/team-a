"use client";

import Link from "next/link";

export default function ItemsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-7">
      <h1 className="text-xl font-bold">出品を読み込めませんでした</h1>
      <p>時間をおいて再度お試しください。</p>
      <button type="button" onClick={reset} className="rounded-xl border p-3">
        もう一度読み込む
      </button>
      <Link href="/items" className="block underline">
        出品一覧へ
      </Link>
    </div>
  );
}
