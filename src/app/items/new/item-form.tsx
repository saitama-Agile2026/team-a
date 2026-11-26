"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { FormField } from "@/components/form-field";
import { ItemImagePicker } from "@/components/item-image-picker";
import { type FieldErrors, toFieldErrors } from "@/lib/validation/auth";
import { createItemSchema, ITEM_CONDITIONS } from "@/lib/validation/items";
import { createOfferSchema } from "@/lib/validation/offers";

const textareaClass =
  "w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm";
const longFields = [
  {
    name: "description",
    label: "説明（状態の補足も記入）",
    max: 5000,
    required: true,
  },
  {
    name: "wantedText",
    label: "交換で欲しい物（任意）",
    max: 2000,
    required: false,
  },
  {
    name: "pickupNote",
    label: "受け渡し希望の場所・時間帯（任意）",
    max: 1000,
    required: false,
  },
] as const;

export function ItemForm({ offerItemId }: { offerItemId?: number }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [images, setImages] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(false);
  const uploaded = useRef<{ files: File[]; keys: string[] } | null>(null);
  const [sent, setSent] = useState(false);
  const schema = offerItemId ? createOfferSchema : createItemSchema;
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || preparing) return;
    const parsed = schema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    setError("");
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    submitting.current = true;
    setPending(true);
    try {
      let imageKeys: string[] = [];
      if (images.length > 0) {
        if (uploaded.current?.files === images) {
          imageKeys = uploaded.current.keys;
        } else {
          const form = new FormData();
          for (const image of images) form.append("files", image);
          const upload = await fetch("/api/upload", {
            method: "POST",
            body: form,
          });
          const result = await upload.json();
          if (!upload.ok) {
            setError(result.error ?? "画像の保存に失敗しました");
            return;
          }
          imageKeys = result.images.map((image: { key: string }) => image.key);
          uploaded.current = { files: images, keys: imageKeys };
        }
      }
      const response = await fetch(
        offerItemId ? `/api/items/${offerItemId}/offers` : "/api/items",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...parsed.data, imageKeys }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setErrors(result.fieldErrors ?? {});
        if (result.fieldErrors?.imageKeys) uploaded.current = null;
        setError(
          result.error ??
            (offerItemId ? "要望の送信に失敗しました" : "出品に失敗しました"),
        );
        return;
      }
      if (offerItemId) {
        setSent(true);
        return;
      }
      router.push(`/items/${result.id}`);
      router.refresh();
    } catch {
      setError(
        offerItemId
          ? "通信に失敗しました。同じ内容で再送信すると、送信済みの場合はその要望が返されます。"
          : "通信に失敗しました。送信済みの可能性もあるため、一覧を確認してから再度お試しください。",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (sent)
    return (
      <div className="space-y-4">
        <output className="block font-bold">
          交換の要望を送信しました。出品者の確認をお待ちください。
        </output>
        <Link href={`/items/${offerItemId}`} className="block underline">
          出品詳細に戻る
        </Link>
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <ItemImagePicker
          files={images}
          disabled={pending}
          onChange={setImages}
          onBusyChange={setPreparing}
        />
        {errors.imageKeys && (
          <p role="alert" className="text-sm text-red-600">
            {errors.imageKeys}
          </p>
        )}
        <FormField
          name="title"
          label={offerItemId ? "差し出す物のタイトル" : "タイトル"}
          maxLength={100}
          required
          error={errors.title}
        />
        <FormField
          name="category"
          label="カテゴリ"
          placeholder="教科書、機材、日用品など"
          maxLength={50}
          required
          error={errors.category}
        />
        <div>
          <label htmlFor="condition" className="mb-2 block text-sm font-bold">
            商品の状態
          </label>
          <select
            id="condition"
            name="condition"
            required
            defaultValue=""
            aria-invalid={!!errors.condition}
            aria-describedby={errors.condition ? "condition-error" : undefined}
            className={textareaClass}
          >
            <option value="" disabled>
              選んでください
            </option>
            {ITEM_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
          {errors.condition && (
            <p
              id="condition-error"
              role="alert"
              className="text-sm text-red-600"
            >
              {errors.condition}
            </p>
          )}
        </div>
        {longFields
          .filter((field) => !offerItemId || field.name === "description")
          .map((field) => (
            <div key={field.name}>
              <label
                htmlFor={field.name}
                className="mb-2 block text-sm font-bold"
              >
                {field.label}
              </label>
              <textarea
                id={field.name}
                name={field.name}
                maxLength={field.max}
                required={field.required}
                rows={4}
                aria-invalid={!!errors[field.name]}
                aria-describedby={
                  errors[field.name] ? `${field.name}-error` : undefined
                }
                className={textareaClass}
              />
              {errors[field.name] && (
                <p
                  id={`${field.name}-error`}
                  role="alert"
                  className="text-sm text-red-600"
                >
                  {errors[field.name]}
                </p>
              )}
            </div>
          ))}
        {offerItemId ? (
          <div>
            <label htmlFor="message" className="mb-2 block text-sm font-bold">
              出品者へのメッセージ
            </label>
            <textarea
              id="message"
              name="message"
              required
              maxLength={2000}
              rows={4}
              className={textareaClass}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? "message-error" : undefined}
            />
            {errors.message && (
              <p
                id="message-error"
                role="alert"
                className="text-sm text-red-600"
              >
                {errors.message}
              </p>
            )}
          </div>
        ) : (
          <FormField
            name="wantedCategory"
            label="欲しい物のカテゴリ（任意）"
            maxLength={50}
            error={errors.wantedCategory}
          />
        )}
        <button
          type="submit"
          disabled={preparing || pending}
          className="w-full rounded-xl bg-[var(--accent)] p-3 font-bold text-white disabled:opacity-50"
        >
          {preparing
            ? "画像を圧縮しています…"
            : pending
              ? "画像と入力内容を送信しています…"
              : offerItemId
                ? "交換の要望を送信する"
                : "出品を公開する"}
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Link href="/items" className="block text-center text-sm underline">
        出品一覧に戻る
      </Link>
    </form>
  );
}
