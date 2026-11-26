import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { requireUser } from "@/lib/auth/authz";
import { getItem } from "@/lib/items";
import { offerUnavailableReason } from "@/lib/validation/offers";
import { ItemForm } from "../../new/item-form";

type Props = { params: Promise<{ id: string }> };

export default function OfferPage(props: Props) {
  return (
    <KururiShell>
      <div className="p-7">
        <BrandHeader />
        <Suspense
          fallback={
            <output className="block py-6">出品を確認しています…</output>
          }
        >
          <Offer {...props} />
        </Suspense>
      </div>
    </KururiShell>
  );
}

async function Offer({ params }: Props) {
  const user = await requireUser();
  const { id: value } = await params;
  const id = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(id) || id > 2147483647)
    notFound();
  const item = await getItem(id);
  if (!item) notFound();
  const reason = offerUnavailableReason(item, user.id);
  if (reason)
    return (
      <div className="space-y-4 py-6">
        <p>{reason}</p>
        <Link href="/items" className="underline">
          一覧に戻る
        </Link>
      </div>
    );
  return (
    <>
      <h1 className="mt-6 text-2xl font-bold">交換を申し込む</h1>
      <p className="my-4 text-sm break-words">
        「{item.title}」と交換する、あなたの差し出す物を入力してください。
      </p>
      <ItemForm offerItemId={id} />
    </>
  );
}
