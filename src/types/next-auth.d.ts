import type { DefaultSession } from "next-auth";

type Role = "user" | "admin";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt は @auth/core/jwt の再エクスポートなので、元のモジュールを拡張する
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
