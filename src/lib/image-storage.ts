import "server-only";
import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export class StorageNotConfiguredError extends Error {}

function storageConfig() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  if (
    !endpoint ||
    !region ||
    !bucket ||
    !accessKeyId ||
    !secretAccessKey ||
    !publicBaseUrl
  ) {
    throw new StorageNotConfiguredError("画像ストレージが未設定です");
  }
  // 設定値はサーバー内部でのみ扱い、エラーに埋め込まない。
  try {
    if (
      new URL(endpoint).protocol !== "https:" ||
      new URL(publicBaseUrl).protocol !== "https:"
    ) {
      throw new Error();
    }
  } catch {
    throw new StorageNotConfiguredError(
      "画像ストレージの設定が正しくありません",
    );
  }
  return {
    endpoint,
    region,
    bucket,
    credentials: { accessKeyId, secretAccessKey },
    publicBaseUrl,
  };
}

export async function storeImages(ownerId: number, images: Buffer[]) {
  const config = storageConfig();
  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: config.credentials,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    maxAttempts: 2,
  });
  const keys = images.map(() => `uploads/${ownerId}/${randomUUID()}.webp`);
  const attemptedKeys: string[] = [];
  try {
    for (const [index, image] of images.entries()) {
      const key = keys[index];
      // PUTの応答前に接続が切れた場合も、保存されている可能性がある。
      attemptedKeys.push(key);
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: image,
          ContentType: "image/webp",
        }),
      );
    }
    return keys.map((key) => ({
      key,
      url: `${config.publicBaseUrl.replace(/\/+$/, "")}/${key}`,
    }));
  } catch (error) {
    const cleanup = await Promise.allSettled(
      attemptedKeys.map((Key) =>
        client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key })),
      ),
    );
    if (cleanup.some((result) => result.status === "rejected")) {
      console.error("[upload] failed to clean up incomplete upload");
    }
    throw error;
  } finally {
    client.destroy();
  }
}
