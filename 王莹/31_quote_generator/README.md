# 作品31 — 見積書自動生成システム

**Kintone 見積案件 → 航空運賃見積書 → PDF ダウンロード**

## 概要

Kintone の見積案件（App #1000）から案件情報を取得し、航空運賃見積書（A4フォーマット）を自動生成するツールです。

「手書き・コピペで30分」→「クリック1回で3秒」を実現します。

## 機能

- Kintone App #1000 からリアルタイムで見積案件を取得
- ステータス別フィルター・キーワード検索
- 案件をクリックするだけで見積書を即時生成
- PDF ダウンロード（ブラウザ印刷）

## 使用技術

- Next.js 16 (App Router)
- Kintone REST API (`/k/v1/records.json`)
- Service-side API Route（API Token をクライアントに非公開）
- `@media print` による PDF 出力最適化

## セットアップ

```bash
npm install
```

`.env.local` に Kintone の認証情報を設定：

```
KINTONE_SUBDOMAIN=your-subdomain
KINTONE_APP_ID=1000
KINTONE_API_TOKEN=your-api-token
```

```bash
npm run dev
```

## Kintone フィールド対応表

| 見積書項目 | Kintone フィールド |
|-----------|-----------------|
| 見積番号 | 見積番号 |
| 宛先（御中） | 顧客名書出 |
| 輸送区間 | 積込港 → 仕向地 |
| 見積日・有効期限 | 見積日（+30日） |
| 本件見積合計金額 | 本件見積額 |
| 担当者 | 社内担当者 |
