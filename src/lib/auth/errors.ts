import { CredentialsSignin } from "next-auth";

export const RATE_LIMITED_CODE = "rate_limited";

/** ログイン試行回数の上限に達してロック中のときに authorize から投げる */
export class TooManyAttemptsError extends CredentialsSignin {
  code = RATE_LIMITED_CODE;
}
