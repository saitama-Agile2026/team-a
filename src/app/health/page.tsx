import { existsSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

// Cache Components配下では、キャッシュしない動的データ（今回はDB接続確認）を
// 使うページは`instant = false`にしないとプリレンダーでエラーになる
export const instant = false;

// ローカル確認用。public/配下にコミットしてあるので常に存在する前提。
const LOCAL_HEALTH_CHECK_IMAGE = "/health-check.svg";
// 本番バケットにこのファイル名で確認用画像を置いてもらう（公開URLはS3_PUBLIC_BASE_URLから組み立てる）。
const HEALTH_CHECK_OBJECT_KEY = "health-check.jpg";

async function checkDb() {
  try {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    return { ok: true as const, userCount: Number(count) };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// 開発: public/配下の画像をファイルシステムで確認。
// 本番: S3_PUBLIC_BASE_URL（Neon Object Storageバケットの公開URLのベース。
// 画像アップロード機能(M2)でも使い回す汎用の値）を設定すると、
// そこにHEALTH_CHECK_OBJECT_KEYを足したURLをHTTPで確認する
// （未設定ならローカル画像のまま＝本番セットアップ待ち）。
async function checkImage() {
  const baseUrl = process.env.S3_PUBLIC_BASE_URL;

  if (!baseUrl) {
    const localPath = path.join(process.cwd(), "public", "health-check.svg");
    const ok = existsSync(localPath);
    return {
      ok,
      src: LOCAL_HEALTH_CHECK_IMAGE,
      message: ok ? undefined : "public/health-check.svg が見つかりません",
    };
  }

  const publicUrl = `${baseUrl.replace(/\/$/, "")}/${HEALTH_CHECK_OBJECT_KEY}`;
  try {
    const res = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
    return {
      ok: res.ok,
      src: publicUrl,
      message: res.ok ? undefined : `status: ${res.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      src: publicUrl,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// Vercel⇔Neonの接続確認用。本番の秘密情報は表示しない。
export default async function HealthPage() {
  const result = await checkDb();
  const imageResult = await checkImage();
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h1 className="text-lg font-bold mb-4">DB接続確認</h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                result.ok ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {result.ok ? "接続OK" : "接続NG"}
            </span>
          </div>

          {result.ok ? (
            <p className="mt-3 text-sm text-gray-600">
              usersテーブル件数: {result.userCount}
            </p>
          ) : (
            <p className="mt-3 text-sm text-red-600 break-all">
              {result.message}
            </p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold mb-4">画像ストレージ確認</h2>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block h-3 w-3 rounded-full ${
                imageResult.ok ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="font-medium">
              {imageResult.ok ? "表示OK" : "表示NG"}
            </span>
          </div>

          {imageResult.message && (
            <p className="mt-3 text-sm text-red-600 break-all">
              {imageResult.message}
            </p>
          )}

          {imageResult.ok && (
            // biome-ignore lint/performance/noImgElement: 外部URL（本番はNeon Object Storage）を直接確認するため
            <img
              src={imageResult.src}
              alt="画像ストレージ動作確認用"
              className="mt-3 max-h-32 rounded border"
            />
          )}
        </div>

        <p className="text-xs text-gray-400">environment: {env}</p>
      </div>
    </main>
  );
}
