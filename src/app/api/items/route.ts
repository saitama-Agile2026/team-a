import { NextResponse } from "next/server";
import { db } from "@/db";
import { itemImages, items } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/authz";
import {
  InvalidStoredImageError,
  resolveImageUrls,
  StorageNotConfiguredError,
} from "@/lib/image-storage";
import { itemSearchSchema } from "@/lib/item-search";
import { ITEMS_PAGE_SIZE, listItems } from "@/lib/items";
import { toFieldErrors } from "@/lib/validation/auth";
import { createItemSchema } from "@/lib/validation/items";

export async function GET(request: Request) {
  try {
    if (!(await getCurrentUser())) {
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    }
    const query = new URL(request.url).searchParams;
    const input = Object.fromEntries(query);
    if (
      ["page", "q", "category", "condition", "wanted"].some(
        (key) => query.getAll(key).length > 1,
      )
    ) {
      return NextResponse.json(
        { error: "同じ検索条件を複数指定できません" },
        { status: 400 },
      );
    }
    const parsed = itemSearchSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "検索条件を確認してください",
          fieldErrors: toFieldErrors(parsed.error),
        },
        { status: 400 },
      );
    }
    const rows = await listItems(parsed.data.page, parsed.data);
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
    const { imageKeys, ...data } = parsed.data;
    const urls = await resolveImageUrls(user.id, imageKeys);
    const item = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(items)
        .values({
          ...data,
          ownerId: user.id,
          wantedCategory: data.wantedCategory || null,
          wantedText: data.wantedText || null,
          pickupNote: data.pickupNote || null,
        })
        .returning({ id: items.id });
      if (urls.length > 0) {
        await tx.insert(itemImages).values(
          urls.map((url, sortOrder) => ({
            itemId: created.id,
            url,
            sortOrder,
          })),
        );
      }
      return created;
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidStoredImageError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: { imageKeys: error.message } },
        { status: 400 },
      );
    }
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        { error: "画像保存の設定を確認してください" },
        { status: 503 },
      );
    }
    console.error("[items] failed to create item");
    return NextResponse.json(
      { error: "出品に失敗しました。時間をおいて再度お試しください" },
      { status: 500 },
    );
  }
}
