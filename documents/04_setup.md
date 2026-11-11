# 開発環境セットアップ手順

対象読者：このリポジトリをクローンしてこれから手を動かす開発メンバー。
技術的な背景は [02_tech_spec.md](02_tech_spec.md) を参照。**本番の値は一切使わない**ので、安心して手を動かしてOK。

## 前提

- [Bun](https://bun.sh) がインストール済み（`package.json`の`packageManager`で`bun@1.3.5`指定）
- Docker / Docker Composeが使える（Docker Desktop等）

## 手順

### 1. `drizzle-kit`用の`dotenv`を追加（未インストールの場合）

```bash
bun add -d dotenv
```

`drizzle-kit`（`db:generate`/`db:migrate`/`db:studio`）はBunの自動`.env.local`読み込みに乗らないことがあるため、`drizzle.config.ts`で明示的に読み込んでいる。

### 2. `.env.local`を作成

```bash
cp .env.example .env.local
```

値はそのまま使ってOK。すべてローカルのDocker（Postgres）向けの値で、本番の秘密情報は入っていない。画像アップロード機能はM2で実装予定（開発時はローカルディスク保存、Dockerの画像ストレージは使わない）。

### 3. Postgresを起動

```bash
docker compose up -d
```

### 4. DBにテーブルを作成

```bash
bun run db:generate   # src/db/schema.ts から migration SQL を drizzle/ に生成（git管理する）
bun run db:migrate    # 生成した SQL を Postgres に反映
```

### 5. 開発サーバーを起動

```bash
bun run dev
```

`http://localhost:3000` を開く。

## 確認ポイント

| 確認項目 | 方法 |
|---|---|
| Postgresが起動してる | `docker compose ps` で `postgres` が `Up` |
| テーブルができてる | `bun run db:studio` → Drizzle Studioで `users` 等のテーブルが見える |
| Next.jsが動いてる | `http://localhost:3000` が表示される |

## よくあるエラー

| 症状 | 原因・対処 |
|---|---|
| `docker compose up`で`port is already allocated` | 5432を他のアプリ(ローカルPostgres等)が使っている。そのアプリを止めるか、`docker-compose.yml`のポート番号を変更する |
| `bun run db:migrate`で接続エラー | `docker compose ps`でPostgresが起動しているか確認。`.env.local`の`DATABASE_URL`を確認 |
| `bun run db:migrate`で`Please provide required params for Postgres driver: url: undefined` | `drizzle-kit`が`.env.local`を読めていない。手順1で`dotenv`を入れたか、`drizzle.config.ts`に`config({ path: ".env.local" })`があるか確認 |
| `bun run dev`で`DATABASE_URL is not set`エラー | `.env.local`を作成し忘れている（手順2） |

## 次にやること

[03_milestones.md](03_milestones.md) の M1（認証基盤）へ。
