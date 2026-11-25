import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <h1 className="mb-4 text-3xl font-bold">SIW Swap</h1>
      <p className="mb-8 text-sm text-gray-600">
        学内のメールアドレスで、使わなくなった物を交換できる物々交換所です。
      </p>
      <div className="flex w-full flex-col gap-3">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white"
        >
          ログイン
        </Link>
        <Link
          href="/register"
          className="rounded border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50"
        >
          会員登録
        </Link>
      </div>
    </main>
  );
}
