import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { items, offerImages, offers, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/authz";
import {
  InvalidStoredImageError,
  resolveImageUrls,
  StorageNotConfiguredError,
} from "@/lib/image-storage";
import { toFieldErrors } from "@/lib/validation/auth";
import {
  createOfferSchema,
  offerUnavailableReason,
} from "@/lib/validation/offers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const protocol =
    request.headers.get("x-forwarded-proto") ??
    new URL(request.url).protocol.replace(":", "");
  if (
    request.headers.get("origin") !==
    `${protocol}://${request.headers.get("host")}`
  ) {
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
    const { id: value } = await params;
    const id = Number(value);
    if (
      !/^[1-9]\d*$/.test(value) ||
      !Number.isSafeInteger(id) ||
      id > 2147483647
    ) {
      return NextResponse.json(
        { error: "出品が見つかりません" },
        { status: 404 },
      );
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "リクエストの形式が正しくありません" },
        { status: 400 },
      );
    }
    const parsed = createOfferSchema.safeParse(body);
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
    const result = await db.transaction(async (tx) => {
      // 承諾・取り下げと同時に送信されても、最新の出品状態を確認する。
      const [item] = await tx
        .select()
        .from(items)
        .where(eq(items.id, id))
        .for("update");
      if (!item) return { error: "出品が見つかりません", status: 404 };
      const [owner] = await tx
        .select({ isActive: users.isActive })
        .from(users)
        .where(eq(users.id, item.ownerId));
      if (!owner?.isActive)
        return { error: "出品が見つかりません", status: 404 };
      const reason = offerUnavailableReason(item, user.id);
      if (reason) return { error: reason, status: 409 };

      // 同じ内容の再送信は既存の要望を返し、通信再試行による二重登録を防ぐ。
      const duplicates = await tx
        .select({ id: offers.id })
        .from(offers)
        .where(
          and(
            eq(offers.itemId, id),
            eq(offers.requesterId, user.id),
            eq(offers.status, "pending"),
            eq(offers.title, data.title),
            eq(offers.description, data.description),
            eq(offers.category, data.category),
            eq(offers.condition, data.condition),
            eq(offers.message, data.message),
          ),
        );
      for (const duplicate of duplicates) {
        const existing = await tx
          .select({ url: offerImages.url })
          .from(offerImages)
          .where(eq(offerImages.offerId, duplicate.id))
          .orderBy(offerImages.sortOrder, offerImages.id);
        if (
          existing.length === urls.length &&
          existing.every((image, index) => image.url === urls[index])
        ) {
          return { id: duplicate.id, status: 200 };
        }
      }
      const [created] = await tx
        .insert(offers)
        .values({
          ...data,
          itemId: id,
          requesterId: user.id,
        })
        .returning({ id: offers.id });
      if (urls.length > 0) {
        await tx.insert(offerImages).values(
          urls.map((url, sortOrder) => ({
            offerId: created.id,
            url,
            sortOrder,
          })),
        );
      }
      return { id: created.id, status: 201 };
    });
    if ("error" in result)
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    return NextResponse.json({ id: result.id }, { status: result.status });
  } catch (error) {
    if (error instanceof InvalidStoredImageError)
      return NextResponse.json(
        { error: error.message, fieldErrors: { imageKeys: error.message } },
        { status: 400 },
      );
    if (error instanceof StorageNotConfiguredError)
      return NextResponse.json(
        { error: "画像保存の設定を確認してください" },
        { status: 503 },
      );
    console.error("[offers] failed to send offer");
    return NextResponse.json(
      { error: "要望の送信に失敗しました。時間をおいて再度お試しください" },
      { status: 500 },
    );
  }
}
