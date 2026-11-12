import { sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

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

// Vercel⇔Neonの接続確認用。本番の秘密情報は表示しない。
export default async function HealthPage() {
  const result = await checkDb();
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-lg border border-gray-200 p-6">
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

        <p className="mt-6 text-xs text-gray-400">environment: {env}</p>
      </div>
    </main>
  );
}
