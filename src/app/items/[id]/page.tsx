import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { requireUser } from "@/lib/auth/authz";
import { getItem, getItemImages } from "@/lib/items";

type Props = { params: Promise<{ id: string }> };
const statusLabels = {
  open: "公開中",
  matched: "交換成立",
  completed: "交換完了",
  closed: "公開終了",
};

export default function ItemPage(props: Props) {
  return (
    <KururiShell>
      <div className="p-7">
        <BrandHeader />
        <Suspense
          fallback={
            <output className="block py-6">出品を読み込んでいます…</output>
          }
        >
          <ItemDetail {...props} />
        </Suspense>
      </div>
    </KururiShell>
  );
}

async function ItemDetail({ params }: Props) {
  const user = await requireUser();
  const { id: value } = await params;
  if (!/^[1-9]\d*$/.test(value)) notFound();
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id > 2147483647) notFound();
  const item = await getItem(id);
  if (!item) notFound();
  const expired = item.expiresAt && item.expiresAt <= new Date();
  if ((item.status === "closed" || expired) && item.ownerId !== user.id)
    notFound();
  const images = await getItemImages(id);
  return (
    <article className="space-y-5 pt-6">
      <p className="text-sm text-[var(--muted)]">
        {expired ? "公開終了" : statusLabels[item.status]}
        {item.ownerId === user.id && "・あなたの出品"}
      </p>
      <h1 className="text-2xl font-bold break-words">{item.title}</h1>
      {images.map((image) => (
        <Image
          key={image.id}
          src={image.url}
          alt={item.title}
          width={440}
          height={330}
          unoptimized
          className="h-auto w-full rounded-xl object-contain"
        />
      ))}
      <dl className="space-y-4 text-sm">
        {[
          ["出品者", item.nickname],
          ["カテゴリ", item.category],
          ["商品の状態", item.condition],
          ["説明", item.description],
          ["欲しい物のカテゴリ", item.wantedCategory || "指定なし"],
          ["交換で欲しい物", item.wantedText || "指定なし"],
          ["受け渡し希望", item.pickupNote || "相談して決定"],
        ].map(([label, content]) => (
          <div key={label}>
            <dt className="mb-1 font-bold">{label}</dt>
            <dd className="whitespace-pre-wrap break-words">{content}</dd>
          </div>
        ))}
      </dl>
      <Link href="/items" className="block text-sm underline">
        出品一覧に戻る
      </Link>
    </article>
  );
}
