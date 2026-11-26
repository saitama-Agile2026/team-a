"use client";

import Image from "next/image";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { compressImage } from "@/lib/compress-image";

type Props = {
  files: File[];
  disabled: boolean;
  onChange: (files: File[]) => void;
  onBusyChange: (busy: boolean) => void;
};

function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? (
    <Image
      src={url}
      alt={file.name}
      width={120}
      height={120}
      unoptimized
      className="aspect-square w-full rounded-xl object-cover"
    />
  ) : null;
}

export function ItemImagePicker({
  files,
  disabled,
  onChange,
  onBusyChange,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const locked = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function select(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0 || locked.current) return;
    if (files.length + selected.length > 3) {
      setError("画像は合計3枚まで選べます");
      return;
    }
    locked.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    try {
      const compressed: File[] = [];
      for (const file of selected) compressed.push(await compressImage(file));
      if (mounted.current) onChange([...files, ...compressed]);
    } catch (error) {
      if (mounted.current)
        setError(
          error instanceof Error ? error.message : "画像の圧縮に失敗しました",
        );
    } finally {
      locked.current = false;
      if (mounted.current) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="item-images" className="block text-sm font-bold">
        画像（任意・最大3枚）
      </label>
      <p id="item-images-hint" className="text-xs text-[var(--muted)]">
        JPEG・PNG・WebP。選択後に自動で1枚1MiB以下に圧縮します。最初の画像が一覧に表示されます。
      </p>
      <input
        id="item-images"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={disabled || busy || files.length >= 3}
        onChange={select}
        aria-describedby="item-images-hint"
        className="w-full text-sm"
      />
      {busy && <output className="block text-sm">画像を圧縮しています…</output>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        {files.map((file, index) => (
          <div
            key={index === 0 ? `first-${file.name}` : `${index}-${file.name}`}
            className="min-w-0 space-y-1"
          >
            <Preview file={file} />
            <p className="truncate text-xs">{file.name}</p>
            <p className="text-xs text-[var(--muted)]">
              {Math.ceil(file.size / 1024)}KiB
            </p>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange(files.filter((_, i) => i !== index))}
              aria-label={`画像${index + 1}を削除`}
              className="text-sm underline disabled:opacity-50"
            >
              削除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
