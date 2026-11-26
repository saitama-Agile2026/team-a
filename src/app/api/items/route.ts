import { NextResponse } from "next/server";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/authz";
import { ITEMS_PAGE_SIZE, listItems } from "@/lib/items";
import { toFieldErrors } from "@/lib/validation/auth";
import { createItemSchema, itemPageSchema } from "@/lib/validation/items";

export async function GET(request: Request) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    }
    const page = itemPageSchema.safeParse(
      new URL(request.url).searchParams.get("page") ?? 1,
    );
    if (!page.success)
      return NextResponse.json(
        { error: "ページ番号が正しくありません" },
        { status: 400 },
      );
    const rows = await listItems(page.data);
    return NextResponse.json(
      {
        items: rows.slice(0, ITEMS_PAGE_SIZE),
        hasNext: rows.length > ITEMS_PAGE_SIZE,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    console.error("[items] failed to list items");
    return NextResponse.json(
      { error: "出品を取得できませんでした" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  // JSONと同一Originを要求し、別サイトからのCookie付き投稿を防ぐ。
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  const expectedOrigin = `${protocol}://${request.headers.get("host")}`;
  if (request.headers.get("origin") !== expectedOrigin) {
    return NextResponse.json(
      { error: "送信元を確認できませんでした" },
      { status: 403 },
    );
  }
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return NextResponse.json(
      { error: "JSON形式で送信してください" },
      { status: 415 },
    );
  }
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "リクエストの形式が正しくありません" },
        { status: 400 },
      );
    }
    const parsed = createItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "入力内容を確認してください",
          fieldErrors: toFieldErrors(parsed.error),
        },
        { status: 400 },
      );
    }
    const data = parsed.data;
    const [item] = await db
      .insert(items)
      .values({
        ...data,
        ownerId: user.id,
        wantedCategory: data.wantedCategory || null,
        wantedText: data.wantedText || null,
        pickupNote: data.pickupNote || null,
      })
      .returning({ id: items.id });
    return NextResponse.json(item, { status: 201 });
  } catch {
    console.error("[items] failed to create item");
    return NextResponse.json(
      { error: "出品に失敗しました。時間をおいて再度お試しください" },
      { status: 500 },
    );
  }
}
