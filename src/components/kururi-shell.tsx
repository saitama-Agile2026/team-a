import Link from "next/link";
import type { ReactNode } from "react";
import { KururiNavMenu } from "./kururi-nav-menu";

type ShellProps = {
  children: ReactNode;
};

/** SIW くるり共通のアプリフレーム（PCでは中央のカード、モバイルでは全画面） */
export function KururiShell({ children }: ShellProps) {
  return (
    <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-center bg-[var(--bg)] sm:bg-[var(--page-bg)] sm:px-4 sm:py-10">
      <main className="flex min-h-screen w-full flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] sm:min-h-[676px] sm:max-w-[500px] sm:rounded-[30px] sm:border-[7px] sm:border-white sm:shadow-[0_17px_55px_rgba(28,49,64,0.11)]">
        {children}
      </main>
    </div>
  );
}

type BrandHeaderProps = {
  variant?: "default" | "soft";
};

/** くるり共通のアプリバー */
export function BrandHeader({ variant = "default" }: BrandHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2.5">
      <Link
        href="/"
        className="inline-flex items-center text-[23px] font-black tracking-[-0.06em] text-[var(--accent)]"
      >
        <span
          aria-hidden="true"
          className="mr-2 inline-grid h-[35px] w-[35px] place-items-center rounded-[12px] bg-[var(--accent)] text-[20px] leading-none font-bold text-white"
        >
          ↔
        </span>
        くるり
      </Link>
      <KururiNavMenu variant={variant} />
    </header>
  );
}
