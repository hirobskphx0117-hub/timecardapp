# タイムカード

複数スタッフ対応の勤怠打刻アプリ（Next.js / TypeScript / Tailwind CSS / libSQL）。

## 機能

- スタッフはコードを入力して出勤・休憩入り・休憩終わり・退勤を打刻
- 管理者はパスワードでログインし、スタッフの登録・有効/無効切り替え・削除ができる
- 管理者は日付を選んで全スタッフの打刻記録・勤務時間・休憩時間を確認できる

打刻データはデータベース（libSQL/Turso）に保存されるため、スタッフはそれぞれ自分のスマホ・PCから打刻できます。

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` に以下を設定してください。

| 変数 | 説明 |
| --- | --- |
| `ADMIN_PASSWORD` | 管理画面のログインパスワード（必須） |
| `SESSION_SECRET` | 管理者セッションCookie署名用のランダムな文字列（必須） |
| `DATABASE_URL` | ローカル開発では未設定でOK（`./data/timecard.db` を自動使用）。本番では下記参照 |
| `DATABASE_AUTH_TOKEN` | `DATABASE_URL` がリモート(Turso)の場合のみ必要 |

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) を開いて確認できます。管理画面は `/admin` です。

## 本番データベース（Turso）の準備

各スタッフが別々の端末から打刻するため、ローカルファイルではなくネットワーク上のデータベースが必要です。無料で使える [Turso](https://turso.tech) の利用を想定しています。

1. [Turso](https://turso.tech) にサインアップ
2. データベースを作成し、`Database URL`（`libsql://...`）と `Auth Token` を発行
3. Vercelのプロジェクト設定 → Environment Variables に以下を追加
   - `DATABASE_URL` = 発行された `libsql://...`
   - `DATABASE_AUTH_TOKEN` = 発行されたトークン
   - `ADMIN_PASSWORD` = 管理画面用パスワード
   - `SESSION_SECRET` = ランダムな長い文字列

## ビルド

```bash
npm run build
npm start
```

## Vercelへのデプロイ

このリポジトリを Vercel にインポートし、上記の環境変数を設定してデプロイしてください。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
