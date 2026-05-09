import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { sheetId, sheetName, apiKey } = await req.json();

  // ① Google Sheets API v4 でデータ取得（API Key認証、公開スプレッドシート）
  const range = encodeURIComponent(`${sheetName}!A1:ZZ`);
  const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;

  const sheetsRes = await fetch(sheetsUrl, { cache: "no-store" });
  if (!sheetsRes.ok) {
    const err = await sheetsRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: `Google Sheets 读取失败：${err?.error?.message ?? sheetsRes.status}` },
      { status: 500 }
    );
  }

  const sheetsData = await sheetsRes.json();
  const values: string[][] = sheetsData.values ?? [];
  if (values.length < 2) {
    return NextResponse.json({ error: "Sheets 数据为空（至少需要表头+1行数据）" }, { status: 400 });
  }

  // ② 1行目をヘッダー、残りをデータとして処理
  const headers = values[0].map(h => h.trim().replace(/\s+/g, "_"));
  const dataRows = values.slice(1);

  const records = dataRows.map(row => {
    const fields: Record<string, { value: string }> = {};
    headers.forEach((h, i) => {
      if (h) fields[h] = { value: row[i] ?? "" };
    });
    return fields;
  });

  // ③ Kintone へ一括登録（100件ずつ）
  const kintoneUrl = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json`;
  let synced = 0;
  let failed = 0;
  const chunkSize = 100;

  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const res = await fetch(kintoneUrl, {
      method: "POST",
      headers: {
        "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app: process.env.KINTONE_APP_ID, records: chunk }),
    });
    if (res.ok) synced += chunk.length;
    else failed += chunk.length;
  }

  return NextResponse.json({ synced, failed, timestamp: new Date().toLocaleString("zh-CN") });
}
