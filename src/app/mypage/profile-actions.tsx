"use client";

import { useEffect, useRef, useState } from "react";

const ACTIONS = [
  { id: "requests", label: "📮 交換リクエスト" },
  { id: "history", label: "♻ 交換履歴" },
  { id: "favorites", label: "♡ お気に入り" },
  { id: "settings", label: "⚙ アカウント設定" },
] as const;

export function ProfileActions() {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function showToast(label: string) {
    setToast(`「${label}」は今後のマイルストーンで順次追加予定です。`);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 2900);
  }

  return (
    <>
      <div className="mx-7 mt-[21px] border-t border-[var(--line)]">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => showToast(action.label)}
            className="flex w-full cursor-pointer items-center justify-between border-b border-[var(--line)] bg-transparent px-0.5 py-[13px] text-[12px] text-[var(--text)] transition-colors hover:text-[var(--accent)]"
          >
            <span>{action.label}</span>
            <span aria-hidden="true" className="text-[var(--muted)]">
              ›
            </span>
          </button>
        ))}
      </div>

      {toast && (
        <output
          aria-live="polite"
          className="fixed bottom-[22px] left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#20334f] px-[22px] py-3 text-[13px] text-white shadow-[0_8px_20px_rgba(0,0,0,0.2)]"
        >
          {toast}
        </output>
      )}
    </>
  );
}
