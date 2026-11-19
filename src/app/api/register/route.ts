import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAllowedEmailDomain } from "@/lib/allowed-domain";
import { isAllowedEmail, normalizeEmail } from "@/lib/email-check";
import { hashPassword } from "@/lib/password";
import { registerSchema, toFieldErrors } from "@/lib/validation/auth";

// 会員登録API
// 1. zodで入力チェック
// 2. 学内メール形式チェック（フロントのチェックは信用せず、ここで必ず判定する）
// 3. 重複チェック（DBのunique制約もあるが、分かりやすいエラーを返すため先に確認）
// 4. パスワードをハッシュ化し、メールは小文字化して保存

type ErrorBody = { error: string; fieldErrors?: Record<string, string> };

function errorResponse(status: number, body: ErrorBody) {
  return NextResponse.json(body, { status });
}

const DUPLICATE_EMAIL_MESSAGE = "このメールアドレスは既に登録されています";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return errorResponse(400, { error: "リクエストの形式が正しくありません" });
  }

  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return errorResponse(400, {
      error: "入力内容に誤りがあります",
      fieldErrors: toFieldErrors(parsed.error),
    });
  }

  const { password, nickname } = parsed.data;
  const email = normalizeEmail(parsed.data.email);

  if (!isAllowedEmail(email, getAllowedEmailDomain())) {
    const message = "学内のメールアドレス（siw00〜siw45）で登録してください";
    return errorResponse(400, {
      error: message,
      fieldErrors: { email: message },
    });
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing.length > 0) {
    return errorResponse(409, {
      error: DUPLICATE_EMAIL_MESSAGE,
      fieldErrors: { email: DUPLICATE_EMAIL_MESSAGE },
    });
  }

  const passwordHash = await hashPassword(password);

  try {
    const [created] = await db
      .insert(users)
      .values({ email, passwordHash, nickname })
      .returning({ id: users.id });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    // 同時登録でチェックをすり抜けた場合はDBのunique制約で弾かれる
    if (isUniqueViolation(error)) {
      return errorResponse(409, {
        error: DUPLICATE_EMAIL_MESSAGE,
        fieldErrors: { email: DUPLICATE_EMAIL_MESSAGE },
      });
    }
    // 入力値（パスワード等）はログに出さない
    console.error("[register] failed to create user");
    return errorResponse(500, { error: "登録に失敗しました" });
  }
}

function isUniqueViolation(error: unknown): boolean {
  // postgres-js の一意制約違反は code=23505（drizzleでは cause に入ることがある）
  const candidates = [error, (error as { cause?: unknown })?.cause];
  return candidates.some(
    (e) =>
      typeof e === "object" &&
      e !== null &&
      (e as { code?: string }).code === "23505",
  );
}
