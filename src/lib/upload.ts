import sharp from "sharp";

export const MAX_UPLOAD_FILES = 3;
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_FILES * MAX_IMAGE_BYTES + 64 * 1024;
const formats: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

export class UploadInputError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
  }
}

/** Content-Lengthがない場合も、実際に読み取った量で上限を守る。 */
export async function readUploadForm(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    throw new UploadInputError(
      "multipart/form-data形式で送信してください",
      415,
    );
  }
  if (Number(request.headers.get("content-length")) > MAX_UPLOAD_BYTES) {
    throw new UploadInputError("画像の合計サイズが上限を超えています", 413);
  }
  if (!request.body) throw new UploadInputError("画像を選んでください");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_UPLOAD_BYTES) {
        await reader.cancel();
        throw new UploadInputError("画像の合計サイズが上限を超えています", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new UploadInputError("画像の送信形式が正しくありません");
  }
}

export function getUploadFiles(form: FormData): File[] {
  const values = form.getAll("files");
  if (values.length < 1 || values.length > MAX_UPLOAD_FILES) {
    throw new UploadInputError("画像は1〜3枚で送信してください");
  }
  const files = values.filter((value): value is File => value instanceof File);
  if (
    files.length !== values.length ||
    Array.from(form.keys()).some((name) => name !== "files")
  ) {
    throw new UploadInputError("files項目に画像ファイルを指定してください");
  }
  return files;
}
/** 実データをデコードして形式を確認し、メタデータを含まないWebPとして保存する。 */
export async function prepareImage(file: File): Promise<Buffer> {
  if (file.size === 0) throw new UploadInputError("空の画像は送信できません");
  if (file.size > MAX_IMAGE_BYTES) {
    throw new UploadInputError("画像は1枚1MiB以下に圧縮してください", 413);
  }
  const expectedFormat = formats[file.type];
  if (!expectedFormat)
    throw new UploadInputError("JPEG・PNG・WebPの画像を選んでください", 415);
  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 25_000_000,
      failOn: "warning",
    });
    const metadata = await image.metadata();
    if (metadata.format !== expectedFormat || (metadata.pages ?? 1) !== 1) {
      throw new UploadInputError(
        "画像の形式が一致しないか、アニメーション画像です",
        415,
      );
    }
    const result = await image
      .rotate()
      .resize({
        width: 2048,
        height: 2048,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    if (result.length > MAX_IMAGE_BYTES) {
      throw new UploadInputError(
        "画像を小さくしてから再度送信してください",
        413,
      );
    }
    return result;
  } catch (error) {
    if (error instanceof UploadInputError) throw error;
    throw new UploadInputError(
      "画像を読み取れませんでした。別の画像を選んでください",
      415,
    );
  }
}
