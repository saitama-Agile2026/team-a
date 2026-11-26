const MAX_BYTES = 1024 * 1024;

/** EXIFの向きを反映して縮小し、APIが受け付けるWebPに変換する。 */
export async function compressImage(file: File): Promise<File> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("JPEG・PNG・WebPの画像を選んでください");
  }
  if (file.size === 0 || file.size > 20 * 1024 * 1024) {
    throw new Error("元の画像は空でない20MiB以下のファイルを選んでください");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("画像を読み込めませんでした。別の画像を選んでください");
  }
  try {
    if (bitmap.width * bitmap.height > 25_000_000) {
      throw new Error(
        "画像の解像度が大きすぎます。小さくしてから選んでください",
      );
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("このブラウザでは画像を圧縮できません");
    let scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.8),
      );
      if (!blob || blob.type !== "image/webp")
        throw new Error("このブラウザではWebP画像に変換できません");
      if (blob.size <= MAX_BYTES) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {
          type: "image/webp",
        });
      }
      scale *= 0.75;
    }
    throw new Error(
      "画像を十分に圧縮できませんでした。別の画像を選んでください",
    );
  } finally {
    bitmap.close();
  }
}
