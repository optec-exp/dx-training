import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(req: Request) {
  const { sheetId, sheetName } = await req.json();

  // ① Kintone からデータ取得
  const kUrl = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const kRes = await fetch(kUrl, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!kRes.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });
  const kData = await kRes.json();

  if (!kData.records || kData.records.length === 0) {
    return NextResponse.json({ error: "Kintone 暂无数据" }, { status: 400 });
  }

  // ② レコードを2D配列に変換（1行目=ヘッダー）
  type KintoneRecord = Record<string, { value: string }>;
  const sample = kData.records[0] as KintoneRecord;
  // $ で始まるシステムフィールドを除外
  const headers = Object.keys(sample).filter(k => !k.startsWith("$"));
  const valueRows: string[][] = kData.records.map((r: KintoneRecord) =>
    headers.map(h => String(r[h]?.value ?? ""))
  );
  const allRows = [headers, ...valueRows];

  // ③ Google Sheets に書き込み（サービスアカウント認証）
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON が未設定です" }, { status: 500 });
  }

  try {
    const credentials = JSON.parse(serviceAccountJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    // シートの既存データをクリアしてから書き込み
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:ZZ`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: allRows },
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    return NextResponse.json({
      synced_rows: valueRows.length,
      sheet_url: sheetUrl,
      timestamp: new Date().toLocaleString("zh-CN"),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Google Sheets 写入失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
