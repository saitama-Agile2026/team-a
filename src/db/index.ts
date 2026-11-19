import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// 接続はimport時ではなく初回アクセス時に行う。
// モジュールimportだけでDATABASE_URL未設定エラーが出ると、
// Next.jsのビルド時ページ解析（実際に使わないページもimportされる）が落ちてしまうため。
let instance: Db | undefined;

function getDb(): Db {
  if (!instance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    instance = drizzle(postgres(connectionString), { schema });
  }
  return instance;
}

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver);
  },
});
