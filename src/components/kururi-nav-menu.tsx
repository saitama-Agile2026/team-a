"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  variant?: "default" | "soft";
};

const NAV_ITEMS = [
  { href: "/", label: "トップ" },
  { href: "/login", label: "ログイン" },
  { href: "/register", label: "会員登録" },
  { href: "/mypage", label: "マイページ" },
  { href: "/items", label: "出品一覧" },
  { href: "/items/new", label: "出品する" },
] as const;

export function KururiNavMenu({ variant = "default" }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="メニュー"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`grid h-[37px] w-[37px] cursor-pointer place-items-center rounded-[12px] text-[18px] text-[var(--accent)] transition-colors ${
          variant === "soft"
            ? "bg-white/80 hover:bg-white"
            : "bg-[var(--soft)] hover:bg-[#ffe3d3]"
        }`}
      >
        ☰
      </button>

      {open && (
        <nav
          aria-label="ページ移動"
          className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-[16px] border border-[var(--line)] bg-white py-1.5 shadow-[0_12px_28px_rgba(28,49,64,0.14)]"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-[13px] font-bold text-[var(--text)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
