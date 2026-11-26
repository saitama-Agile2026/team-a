import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BrandHeader, KururiShell } from "@/components/kururi-shell";
import { requireUser } from "@/lib/auth/authz";
import { itemSearchHref, itemSearchSchema } from "@/lib/item-search";
import { ITEMS_PAGE_SIZE, listItems } from "@/lib/items";
import { ITEM_CONDITIONS } from "@/lib/validation/items";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function ItemsPage(props: Props) {
  return (
    <KururiShell>
      <div className="p-7">
        <BrandHeader />
        <div className="my-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">出品一覧</h1>
          <Link
            href="/items/new"
            className="rounded-xl bg-[var(--accent)] px-4 py-3 font-bold text-white"
          >
            出品する
          </Link>
        </div>
        <Suspense fallback={<output>出品を読み込んでいます…</output>}>
          <ItemList {...props} />
        </Suspense>
      </div>
    </KururiShell>
  );
}

async function ItemList({ searchParams }: Props) {
  await requireUser();
  const query = await searchParams;
  const parsed = itemSearchSchema.safeParse(query);
  if (!parsed.success)
    return (
      <p>
        検索条件が正しくありません。
        <Link href="/items" className="underline">
          一覧に戻る
        </Link>
      </p>
    );
  const search = parsed.data;
  const page = search.page;
  const rows = await listItems(page, search);
  return (
    <>
      <form
        key={itemSearchHref(search, 1)}
        action="/items"
        method="get"
        className="mb-6 space-y-3 rounded-2xl border border-[var(--line)] p-4"
      >
        <div>
          <label htmlFor="search-q" className="mb-1 block text-sm font-bold">
            キーワード
          </label>
          <input
            id="search-q"
            name="q"
            defaultValue={search.q}
            maxLength={100}
            placeholder="タイトル・説明から検索"
            className="w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="search-category"
            className="mb-1 block text-sm font-bold"
          >
            カテゴリ（完全一致）
          </label>
          <input
            id="search-category"
            name="category"
            defaultValue={search.category}
            maxLength={50}
            className="w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="search-condition"
            className="mb-1 block text-sm font-bold"
          >
            商品の状態
          </label>
          <select
            id="search-condition"
            name="condition"
            defaultValue={search.condition}
            className="w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
          >
            <option value="">すべて</option>
            {ITEM_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="search-wanted"
            className="mb-1 block text-sm font-bold"
          >
            交換で欲しい物
          </label>
          <input
            id="search-wanted"
            name="wanted"
            defaultValue={search.wanted}
            maxLength={100}
            placeholder="欲しい物・欲しいカテゴリから検索"
            className="w-full rounded-xl border border-[var(--line)] bg-white p-3 text-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="rounded-xl bg-[var(--accent)] px-5 py-2 font-bold text-white"
          >
            検索する
          </button>
          <Link href="/items" className="text-sm underline">
            条件をクリア
          </Link>
        </div>
      </form>
      {rows.length === 0 ? (
        <p className="py-8 text-[var(--muted)]">表示できる出品はありません。</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {rows.slice(0, ITEMS_PAGE_SIZE).map((item) => (
            <Link
              key={item.id}
              href={`/items/${item.id}`}
              className="min-w-0 rounded-2xl border border-[var(--line)] bg-white p-4 hover:border-[var(--accent)]"
            >
              {item.imageUrl && (
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  width={200}
                  height={150}
                  unoptimized
                  className="mb-3 aspect-[4/3] w-full rounded-xl object-cover"
                />
              )}
              <p className="text-xs text-[var(--muted)] break-words">
                {item.category}・{item.condition}
              </p>
              <h2 className="my-2 font-bold break-words">{item.title}</h2>
              <p className="text-sm break-words">{item.nickname}</p>
              {item.wantedText && (
                <p className="mt-2 line-clamp-2 text-xs break-words">
                  欲しい物：{item.wantedText}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
      <nav aria-label="一覧のページ" className="mt-6 flex justify-between">
        {page > 1 ? (
          <Link href={itemSearchHref(search, page - 1)} className="underline">
            前のページ
          </Link>
        ) : (
          <span />
        )}
        {rows.length > ITEMS_PAGE_SIZE && (
          <Link href={itemSearchHref(search, page + 1)} className="underline">
            次のページ
          </Link>
        )}
      </nav>
    </>
  );
}
