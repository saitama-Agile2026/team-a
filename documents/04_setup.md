# 開発環境セットアップ手順

対象読者：このリポジトリをクローンしてこれから手を動かす開発メンバー。
技術的な背景は [02_tech_spec.md](02_tech_spec.md) を参照。**開発環境も本番と同じNeon DBに接続する**（2026年11月〜。環境差異による検証コストを無くすため）。

## 前提

- [Bun](https://bun.sh) がインストール済み（`package.json`の`packageManager`で`bun@1.3.5`指定）
- PM（kihhiさん）からNeonの接続文字列（`DATABASE_URL`・`DATABASE_URL_UNPOOLED`の2本）を安全な方法（パスワードマネージャー等）で受け取っていること。Slack等の平文・公開チャンネルでのやり取りはしない

## 手順

### 0. リポジトリをクローン

```bash
git clone https://github.com/saitama-Agile2026/team-a.git
cd team-a
```

SSH接続が設定されていない場合はHTTPS版を使う。

```bash
git clone https://github.com/saitama-Agile2026/team-a.git
cd team-a
```

依存パッケージをインストール。

```bash
bun install
```

### 1. `drizzle-kit`用の`dotenv`を追加（未インストールの場合）

```bash
bun add -d dotenv
```

`drizzle-kit`（`db:generate`/`db:migrate`/`db:studio`）はBunの自動`.env.local`読み込みに乗らないことがあるため、`drizzle.config.ts`で明示的に読み込んでいる。

### 2. `.env.local`を作成

```bash
cp .env.example .env.local
```

`.env.local`の`DATABASE_URL`（Pooled connection）と`DATABASE_URL_UNPOOLED`（Direct connection）を、PMから受け取った実際のNeon接続文字列に書き換える。**本番DBそのものに繋がる値なので、他のメンバーや公開の場に共有しない。** 画像アップロード機能はM2で実装予定（開発時はローカルディスク保存、S3関連の設定は不要）。

### 3. DBにテーブルを作成（スキーマ変更がある場合のみ）

すでに本番DBにテーブルは作成済みのため、通常は何もしなくてよい。`src/db/schema.ts`を変更した場合のみ、以下を実行してmigration SQLを生成し、PRに含める。

```bash
bun run db:generate   # src/db/schema.ts から migration SQL を drizzle/ に生成（git管理する）。この時点でDBへの書き込みは発生しない
```

**`bun run db:migrate`は実行しない。** 本番スキーマへの反映はPM（kihhiさん）のみが、PRマージ後に行う（[AGENTS.md](../AGENTS.md)参照）。

### 4. 開発サーバーを起動

```bash
bun run dev
```

`http://localhost:3000` を開く。表示されるデータは本番と同一のNeon DBの内容。確認用に作ったデータ（登録したユーザー等）は、確認後に削除するか`[TEST]`等と分かる形にする。

## 確認ポイント

| 確認項目 | 方法 |
|---|---|
| Neonに接続できている | `http://localhost:3000/health` で🟢接続OK・usersテーブル件数が表示される |
| テーブル内容を見たい | `bun run db:studio` → Drizzle Studioで閲覧（**編集・削除はしない**） |
| Next.jsが動いてる | `http://localhost:3000` が表示される |

## よくあるエラー

| 症状 | 原因・対処 |
|---|---|
| `bun run dev`で`DATABASE_URL is not set`エラー | `.env.local`を作成し忘れている（手順2） |
| `bun run db:generate`で`DATABASE_URL_UNPOOLED`に関するエラー | `.env.local`に`DATABASE_URL_UNPOOLED`（Direct connection）を設定したか確認 |
| `bun run db:migrate`で接続エラーやDDL失敗 | Pooled connection（`-pooler`付き）でDDLを実行しようとしている可能性。本コマンドはPMのみが実行するコマンドのため、開発者は基本的に実行しない |
| `.env.local`の値が分からない／間違えた | PMに再度確認する。自分で接続情報を探しに行かない |

## 次にやること

[03_milestones.md](03_milestones.md) の M1（認証基盤）へ。
