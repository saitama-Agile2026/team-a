# SIW物々交換所（仮） 技術定義書

対象読者：開発メンバー全員。実装前に全員が同じ構成を見れるようにするための定義書。

## 1. 結論（技術スタック）

| 領域 | 選定 | 理由 |
|---|---|---|
| フレームワーク | **Next.js (App Router) + TypeScript** | フロント／API(Route Handlers)が1プロジェクトで完結。Vercelデプロイと相性が良い |
| DB（開発） | **PostgreSQL（Docker Compose）** | 本番(Neon)と同じエンジンでローカル差異を防ぐ |
| DB（本番） | **Neon（Serverless Postgres）** | 既定どおり |
| ORM | **Drizzle** | SQLに近い書き方で学習コストが低い。`drizzle-kit`でマイグレーション管理、Neonとの接続実績も多い |
| 画像保存 | **本番: Neon Object Storage**（S3互換）／**開発: ローカルファイル保存** | 本番はDBと同じNeonに統一。Singapore(ap-southeast-1)リージョンが使える。presigned URL＋CORSでブラウザ直アップロードに対応。開発はDockerの画像用S3互換イメージ(MinIO)の配布が2026年9月頃から不安定になったため、Dockerに依存しないローカルディスク保存にした。DBにはURLのみ保存（方針はproposalのまま） |
| 認証 | **Auth.js (NextAuth) Credentials Provider** | セッション管理はAuth.jsに任せる。学籍番号チェックはフロント（UX用）とサーバー（必須）の両方で同じ判定関数を使う。メール確認リンクは実装しない（なりすましリスクは管理者の無効化機能で対応） |
| バリデーション | **zod** | フォーム入力・API入力の型安全なチェックに使う |
| デプロイ | **Vercel**（Production / Preview） | 既定どおり |
| CI | **GitHub Actions**（lint / typecheck / build） | 4人以上での並行開発なので、マージ前の最低限の自動チェックを入れる |

> 認証・バリデーションのライブラリは後から変更しても大きな手戻りはないので、まずはこの構成で進めてOK。

## 2. 全体構成図

```mermaid
flowchart TB
    subgraph Client[ブラウザ]
        UI[Next.js フロント]
    end
    subgraph Vercel
        UI --> API[Next.js Route Handlers]
    end
    API --> DB[(PostgreSQL)]
    DB -.開発.-> DevDB[(Docker: ローカルPostgres)]
    DB -.本番.-> NeonDB[(Neon Postgres)]
    API --> Obj[(画像保存)]
    Obj -.開発.-> LocalFS[(ローカルディスク\npublic/uploads)]
    Obj -.本番.-> NeonObj[(Neon Object Storage\nap-southeast-1)]
```

## 3. 環境変数一覧

開発環境は**本番の値を一切使わない**。`DATABASE_URL`はDocker Postgresに向け、画像はローカルディスクに保存するので画像用の認証情報は開発時には不要。本番の値（Neon・Vercel）はVercelの環境変数設定とPMの手元だけが知っていればよく、開発者の`.env.local`には入らない。

| 変数名 | 用途 | 開発時の値 | 本番時の値（PM/Vercelのみ） |
|---|---|---|---|
| `DATABASE_URL` | Drizzle(postgres-js)接続先 | Docker ComposeのPostgres | Neonの接続文字列 |
| `ALLOWED_EMAIL_DOMAIN` | 学内メールドメイン判定 | 検証用ダミー値（例: `example.local`） | 実際の学校ドメイン |
| `NEXTAUTH_SECRET` | Auth.jsセッション署名鍵 | 適当なダミー文字列でOK | 本番用ランダム値（厳重管理） |
| `NEXTAUTH_URL` | Auth.jsのベースURL | `http://localhost:3000` | 本番URL |

本番用の画像ストレージ変数（`S3_ENDPOINT`等）はM2（画像アップロード実装）でVercel側にのみ追加する。開発者の`.env.local`には追加しない。

`.env.example`に開発用のデフォルト値をそのまま書いておけば、リポジトリをクローンして`docker compose up`するだけで動く。`.env.local`はgitignore対象。

### `.env.local`（開発用）の例

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/siw_barter
ALLOWED_EMAIL_DOMAIN=example.local
NEXTAUTH_SECRET=dev-secret-anything
NEXTAUTH_URL=http://localhost:3000
```

これをそのまま`.env.example`としてコミットしてOK（本番の秘密情報は含まれていない）。

## 4. 学内限定チェック

[01_proposal.md](01_proposal.md)の判定ロジック（`siw230100`＋学籍番号`01`-`40`＋学校ドメイン）をそのまま使う。同じ判定関数をフロント（登録フォームの即時エラー表示用）とサーバー（API側の必須チェック）の両方から呼ぶ。フロントのチェックはUX向上のためで、実際の制限はサーバー側のみで担保する。

なりすまし登録（他人の学籍番号メールで先に登録される）リスクは、proposal記載どおり**管理者による無効化機能で対応**し、メール確認リンクは実装しない。

## 5. 画像アップロード（開発: ローカルディスク／本番: Neon Object Storage）

画像用のS3互換Dockerイメージ（MinIO）は2026年9月頃からDocker Hub・quay.ioともに配布が不安定になり、再発の可能性もあるため、**開発環境ではDockerに依存しないローカルディスク保存**を採用する。

- **開発：** アップロードAPI（M2で実装）が受け取ったファイルを`public/uploads/`配下に保存し、そのパスをDBに保存。Docker・外部サービス不要
- **本番（Neon Object Storage）：**
  - SDK: `@aws-sdk/client-s3` ＋ `@aws-sdk/s3-request-presigner`
  - 流れ：①ブラウザで画像を圧縮 → ②APIにpresigned PUT URLを発行してもらう → ③ブラウザから直接PUT → ④返ってきたURLをDBに保存
  - バケットの公開設定（`public_read`）はS3 APIではなく**Neonコンソール/API側**で行う（`PutBucketAcl`は未サポート）。CORS設定も作成時に入れておく
  - 既知の制限：バケット通知(SNS/SQS)なし、バージョニング/ライフサイクルは保存されるが効果なし。今回の用途（画像保存のみ）では影響しない
- 開発と本番で保存先が異なるため、アップロード処理は`STORAGE_DRIVER`（`local`/`s3`）で切り替えられる薄い関数にまとめる（M2で実装）

## 6. 開発〜本番のフロー

```mermaid
flowchart LR
    dev[ローカル開発\nDocker Postgres] --> pr[PR作成]
    pr --> preview[Vercel Preview Deploy]
    pr --> pmcheck[PMが.envを本番Neon用に\n差し替えて動作確認]
    pmcheck -->|OK| merge[mainにmerge]
    merge --> prod[Vercel Production]
    prod --> neon[(Neon Production DB)]
```

### PR最終確認（本番Neon + 手動.env差し替え）について

**結論：今の規模（学内・小人数・無料枠）なら、このやり方で進めてOK。** ただし以下の3点は最初から徹底する。

1. `.env`・`.env.local` は必ず `.gitignore` に入れる（本番シークレットの誤コミット防止）
2. Drizzleのマイグレーション（スキーマ変更時に`drizzle-kit generate`で出るSQL）は必ずPRレビュー対象にする。本番DBに当てる前に内容を確認する
3. 本番DBに直接書き込む確認作業なので、確認用データは確認後に消す（または「テスト用」と分かるデータにする）運用ルールをPRテンプレートに書いておく

**気になった場合の発展案（任意・今はやらなくてOK）：** Neonは無料枠でも「ブランチ機能」でDBのクローンを作れる。余裕が出てきたら、本番ブランチをコピーした検証用ブランチを作ってそこで確認する形にすると、本番データに触れずに済む。今は規模的にオーバースペックなので、①〜③のルール運用で十分。

## 7. ディレクトリ構成（初期）

```
siw-barter/
├─ drizzle/            # drizzle-kitが生成するマイグレーションSQL
├─ drizzle.config.ts
├─ src/
│  ├─ app/            # Next.js App Router（画面・API）
│  ├─ db/
│  │  └─ schema.ts    # Drizzleのテーブル定義
│  ├─ lib/            # auth, validation 等の共通処理
│  └─ components/
├─ docker-compose.yml # ローカルPostgres
├─ .env.example
└─ 01_proposal.md, 02_tech_spec.md, 03_milestones.md
```

## 8. テーブル定義

[01_proposal.md](01_proposal.md) 内の「テーブル案」をそのまま採用。変更があれば本ドキュメントではなくproposal側を更新し、ここでは参照のみとする。
