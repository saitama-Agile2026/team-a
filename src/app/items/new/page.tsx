import { Suspense } from "react";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { requireUser } from "@/lib/auth/authz";
import { ItemForm } from "./item-form";

export default function NewItemPage() {
  return (
    <KururiShell>
      <div className="p-7">
        <BrandHeader />
        <h1 className="my-6 text-2xl font-bold">出品する</h1>
        <Suspense fallback={<output>読み込んでいます…</output>}>
          <NewItem />
        </Suspense>
      </div>
    </KururiShell>
  );
}
async function NewItem() {
  await requireUser();
  return <ItemForm />;
}
