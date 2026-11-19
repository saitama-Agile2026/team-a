import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// drizzle-kit(generate/migrate/studio)はDirect connectionを使う。
// Pooled connection(DATABASE_URL)経由だとDDL実行が失敗することがあるため。
const directUrl = process.env.DATABASE_URL_UNPOOLED;
if (!directUrl) {
  throw new Error(
    ".env.local に DATABASE_URL_UNPOOLED (Neon Direct connection) を設定してください",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: directUrl,
  },
});
