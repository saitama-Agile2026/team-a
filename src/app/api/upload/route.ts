import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/authz";
import { StorageNotConfiguredError, storeImages } from "@/lib/image-storage";
import {
  getUploadFiles,
  prepareImage,
  readUploadForm,
  UploadInputError,
} from "@/lib/upload";

export async function POST(request: Request) {
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
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json(
        { error: "ログインしてください" },
        { status: 401 },
      );
    const files = getUploadFiles(await readUploadForm(request));
    const images: Buffer[] = [];
    // 全ファイルの検証が済んでからストレージへ書き込む。
    for (const file of files) images.push(await prepareImage(file));
    const uploaded = await storeImages(user.id, images);
    return NextResponse.json(
      { images: uploaded },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof UploadInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        { error: "画像保存の設定が完了していません。管理者に確認してください" },
        { status: 503 },
      );
    }
    console.error("[upload] failed to upload images");
    return NextResponse.json(
      { error: "画像の保存に失敗しました。時間をおいて再度お試しください" },
      { status: 500 },
    );
  }
}
