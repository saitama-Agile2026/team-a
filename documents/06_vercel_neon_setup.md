# Vercel × Neon 本番環境変数セットアップ

対象読者：開発メンバー全員（Vercel環境変数の設定自体はPM/Infra担当が行うが、開発環境もNeon本番DBに直結するため、接続の仕組みは全員が理解しておく。[02_tech_spec.md](02_tech_spec.md)3章）。マイグレーションの反映作業（4章）はPM（kihhiさん）のみが行う。

## 0. 全体像

```mermaid
flowchart LR
    neon[Neon\n接続文字列を発行] --> vercel[Vercelの\nEnvironment Variables]
    vercel --> redeploy[Redeploy]
    redeploy --> check["/health ページで確認"]
```

マイグレーション（テーブル作成）はVercel上では実行しない。PMが手元で`.env.local`を一時的に本番向けに差し替えて`bun run db:migrate`する、既存の運用ルール（[02_tech_spec.md](02_tech_spec.md)6章）のまま。

## 1. Neon側で接続文字列を2つ取得

Neonコンソール → プロジェクト → **Connect** から、以下2本をコピーしておく。

| 用途 | 使う文字列 | 使う場所 |
|---|---|---|
| アプリ実行用 | **Pooled connection**（ホスト名に`-pooler`が付く方） | Vercelの`DATABASE_URL` |
| マイグレーション用 | **Direct connection**（pooler無し） | PMのローカル（一時的に`.env.local`に入れる） |

> サーバーレス関数からの接続はPooled推奨。マイグレーションはpooler経由だと失敗することがあるのでDirectを使う。

## 2. Vercelに環境変数を登録

Vercel dashboard → 対象プロジェクト → **Settings → Environment Variables** で以下を追加。

**Environmentは`Production`と`Preview`の両方にチェックを入れる。** `Production`だけだと、PR用のブランチ（Previewデプロイ）のビルドで環境変数が読み込まれずエラーになる。今の規模なら同じ値をPreviewにも配ってOK。

| 変数名 | 値 | 備考 |
|---|---|---|
| `DATABASE_URL` | NeonのPooled connection文字列 | |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32`で生成したランダム値 | ローカルのダミー値を使い回さない |
| `NEXTAUTH_URL` | `https://〈本番ドメイン〉` | 独自ドメイン未設定なら`https://〈プロジェクト名〉.vercel.app` |
| `ALLOWED_EMAIL_DOMAIN` | 実際の学校ドメイン | 開発時のダミー値(`example.local`)から本物に変更 |

画像アップロード機能(M2)本体が使う書き込み用の認証情報はM2実装時にここに追加する（今回はまだ不要・未発行）。読み取り専用の`S3_PUBLIC_BASE_URL`は6章で別途設定済み。

## 3. 再デプロイ

環境変数はデプロイ時にしか読み込まれないため、追加後に再デプロイが必要。

- Vercel dashboard → Deployments → 最新デプロイの「…」→ **Redeploy**
- もしくは何か変更をpushして再デプロイを走らせる

## 4. マイグレーションを本番DBに反映

開発環境も常時本番Neonに接続しているため、一時的な`.env.local`の差し替えは不要。PM（kihhiさん）が、常時設定済みの`DATABASE_URL_UNPOOLED`（1章のDirect connection）を使って実行する。

```bash
bun run db:migrate
```

この時の3ルール（[02_tech_spec.md](02_tech_spec.md)6章）を忘れずに：
1. `.env`/`.env.local`はgit管理しない
2. マイグレーションSQLはPRレビュー済みのものだけ当てる
3. 確認用に作ったデータは後で消す

## 5. 接続確認

新しく追加した確認用ページ `/health`（[src/app/health/page.tsx](../src/app/health/page.tsx)）にアクセスする。

```
https://〈本番ドメイン〉/health
```

| 表示 | 意味 |
|---|---|
| 🟢 接続OK・usersテーブル件数: 0件 | Neonに繋がっていて、マイグレーションも反映済み |
| 🔴 接続NG・エラーメッセージ表示 | `DATABASE_URL`の値、または4章のマイグレーションが未実施かを確認 |

## 6. 画像ストレージ（Neon Object Storage）の動作確認

バケット作成後、[#16](https://github.com/saitama-Agile2026/team-a/issues/16)の残作業（CORS設定・public_read設定・アップロード動作確認）をNeonコンソール/API側で行う（`PutBucketAcl`は未サポートなのでS3 APIではなくNeon側の設定を使う。[02_tech_spec.md](02_tech_spec.md)5章）。

### 6-1. `S3_PUBLIC_BASE_URL`は何の値か（DATABASE_URLとの違い）

> **`S3_PUBLIC_BASE_URL`は`postgresql://...`のDB接続文字列とは完全に別物。** `https://...`から始まる、バケットの中身をHTTP GETで読むためのURLのベース部分（＝オブジェクトのキー名より手前の部分）。

| | `DATABASE_URL`（1章） | `S3_PUBLIC_BASE_URL`（本章） |
|---|---|---|
| 形式 | `postgresql://user:pass@host:5432/db` | `https://〈バケットのホスト名〉`（末尾に`/`なし） |
| Pooled / Direct の区別 | **あり**（サーバーレス関数はPooled、マイグレーションはDirect） | **なし**。Object StorageはPostgresの接続プーリングと無関係のHTTP(S)エンドポイントなので、pooled/directという選択肢自体が存在しない |
| 認証情報を含むか | 含む（パスワード） | 含まない。`public_read`設定後は誰でもGETできる公開URLなので、むしろ秘密情報を含んではいけない |
| 用途 | DBへの読み書き（Drizzle経由） | 画像をブラウザ/`<img>`から直接読む（GETのみ） |

将来M2で`/api/upload`がアップロード（`PutObject`）に使う`S3_ENDPOINT`等（[02_tech_spec.md](02_tech_spec.md)3章・5章）は、認証情報付きの別のAPIエンドポイントで、今回の`S3_PUBLIC_BASE_URL`とは別物（書き込み用 vs 読み取り専用公開URL）。混同しないこと。

### 6-2. 値の取得方法

**Neonコンソールのバケット画面（`.../branches/<branch-id>/storage/<bucket名>`）には、公開URLをそのままコピーできる項目は無い。** 自分でAPIから組み立てる必要がある（[Neon公式ドキュメント](https://neon.com/docs/storage/get-started)より）。

1. コンソールのURLから`project_id`と`branch_id`を読み取る（例：`https://console.neon.tech/app/projects/<project_id>/branches/<branch_id>/storage/<bucket名>`の形）
2. Neonコンソール → Account Settings → **API Keys** でAPIキーを発行する（未発行なら）
3. 以下を実行し、レスポンスの`s3_endpoint`を確認する

   ```bash
   curl "https://console.neon.tech/api/v2/projects/<project_id>/branches/<branch_id>/storage" \
     -H "Authorization: Bearer <NEON_API_KEY>"
   ```

   `s3_endpoint`は`https://<branch_id>.storage.c-<N>.<region>.aws.neon.tech`の形（`<N>`と`<region>`はプロジェクトによって決まる値で、レスポンスを見るまで分からない）
4. `S3_PUBLIC_BASE_URL`には**`s3_endpoint` + `/` + バケット名**を入れる
   - 例：`s3_endpoint`が`https://br-shy-truth-azy59lhx.storage.c-2.us-east-2.aws.neon.tech`、バケット名が`images`なら → `S3_PUBLIC_BASE_URL=https://br-shy-truth-azy59lhx.storage.c-2.us-east-2.aws.neon.tech/images`
   - （`health-check.jpg`を置いた場合の実際の公開URLは、このベース+`/health-check.jpg`になる）

`storage`エンドポイントが404の場合、そのブランチでObject Storageが有効になっていない（Object Storageは2026年11月時点でベータ機能）。

### 6-3. 動作確認手順

開発環境も本番と共通の`S3_PUBLIC_BASE_URL`を`.env.local`に設定する方針になったため（[02_tech_spec.md](02_tech_spec.md)3章）、開発環境でも実際にNeon Object Storageバケットへ接続して確認する（`S3_PUBLIC_BASE_URL`が未設定の場合のみ`public/health-check.svg`にフォールバックする）。Vercel（本番）側では以下の手順が必要。

1. 確認用の画像ファイルを`health-check.jpg`という名前でバケットに置く（ファイル名固定。コード側の`HEALTH_CHECK_OBJECT_KEY`と一致させる必要がある）
2. 6-2の手順でバケットの公開URLのベースを控える
3. Vercel dashboard → 対象プロジェクト → **Settings → Environment Variables** に`S3_PUBLIC_BASE_URL`を追加（値＝2のベースURL。`Production`のみでよい）
4. 2章と同様に**再デプロイ**
5. `https://〈本番ドメイン〉/health`にアクセスし、「画像ストレージ確認」欄が🟢・画像が表示されることを確認

`S3_PUBLIC_BASE_URL`は画像アップロード機能（M2）実装時にも、保存したオブジェクトの公開URLを組み立てるために使い回す想定の変数。`/health`専用の値ではない。

| 表示 | 意味 |
|---|---|
| 🟢 表示OK・画像が見える | バケットの公開URLから正常に取得できている |
| 🔴 表示NG・エラーメッセージ | `S3_PUBLIC_BASE_URL`の値（`postgresql://`を入れていないか等）、`health-check.jpg`の配置、またはpublic_read設定を確認 |

## 7. 確認できたら

`/health`はDBのエラー内容が誰でも見える状態のページなので、本番公開前には削除または管理者限定にする（[03_milestones.md](03_milestones.md) M4に追記済み）。
