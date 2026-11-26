import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  compact?: boolean;
};

/** ラベル・入力欄・エラー表示をまとめたフォーム項目 */
export function FormField({
  label,
  name,
  error,
  hint,
  id,
  compact = false,
  ...rest
}: Props) {
  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="block">
      <label
        htmlFor={inputId}
        className="mb-[7px] block text-[12px] font-extrabold text-[var(--text)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-[12px] border bg-[var(--input)] text-[13px] text-[var(--text)] placeholder:text-[#a4aab3] transition-colors focus:border-[var(--accent)] ${
          compact ? "px-3 py-[9px]" : "px-[14px] py-[13px]"
        } ${error ? "border-red-500" : "border-[var(--line)]"}`}
        {...rest}
      />
      {hint && !error && (
        <p
          id={hintId}
          className="mt-1 text-[11px] leading-relaxed text-[var(--muted)]"
        >
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-1 text-[12px] font-medium text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
