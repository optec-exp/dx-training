# 作品30 — 带 Slack 通知的 Kintone 登录表单

販管費（Kintone App #652）の登録フォーム。提交後に Slack Incoming Webhook でチャンネルへ通知を送信します。

## 機能

- Kintone App #652 へのレコード登録
- 登録成功後、Slack チャンネルへ自動通知（費用類型・金額・提交時間・レコード ID）
- 支払先のオートコンプリート検索

## 環境変数

`.env.local` に以下を設定してください：

```
KINTONE_SUBDOMAIN=si8qxbanrfkx
KINTONE_APP_ID=652
KINTONE_API_TOKEN=xxxxxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

Vercel デプロイ時は Environment Variables に同じ値を追加してください。

## 起動

```bash
npm install
npm run dev
```
