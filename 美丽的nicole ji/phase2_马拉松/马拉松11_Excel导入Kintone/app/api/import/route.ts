import { NextResponse } from "next/server";

type Row = Record<string, string>;

export async function POST(req: Request) {
  const { rows }: { rows: Row[] } = await req.json();
  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "データがありません" }, { status: 400 });
  }

  const kintoneUrl = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json`;
  const token = process.env.KINTONE_API_TOKEN!;
  const appId = process.env.KINTONE_APP_ID!;

  let success = 0;
  let failed = 0;

  // Kintone は1回のリクエストで最大100件まで登録可能
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    // 各行のフィールドを Kintone 形式に変換
    const records = chunk.map(row => {
      const fields: Record<string, { value: string }> = {};
      for (const [key, val] of Object.entries(row)) {
        // フィールドコードは英数字・アンダースコアのみ（スペースをアンダースコアに変換）
        const fieldCode = key.replace(/\s+/g, "_").replace(/[^\w]/g, "");
        if (fieldCode) fields[fieldCode] = { value: String(val) };
      }
      return fields;
    });

    const res = await fetch(kintoneUrl, {
      method: "POST",
      headers: {
        "X-Cybozu-API-Token": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app: appId, records }),
    });

    if (res.ok) {
      success += chunk.length;
    } else {
      failed += chunk.length;
    }
  }

  return NextResponse.json({ success, failed });
}
