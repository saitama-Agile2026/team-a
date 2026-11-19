import type { NextAuthConfig } from "next-auth";

// Auth.js の共通設定（DBアクセスを含まない部分）
// Provider（DB参照あり）は src/auth.ts で追加する。
// 認可ミドルウェア（proxy）からも読み込めるよう、ここには重い依存を入れない。

export const authConfig = {
  // NEXTAUTH_SECRET でセッション(JWT)を署名する
  secret: process.env.NEXTAUTH_SECRET,
  // ベースURLは NEXTAUTH_URL で固定される（next-auth がリクエストURLを上書きする）ため、
  // Host ヘッダを信頼しても問題ない。`next start` でのローカル確認時にも必要。
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      // ログイン直後のみ user が渡される。ID と role をトークンに保存する
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
