import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { srcApp, dstApp, srcToken, dstToken, limit } = await req.json();
  const subdomain = process.env.KINTONE_SUBDOMAIN!;

  // ① 来源 App からレコード取得
  const getUrl = `https://${subdomain}.cybozu.com/k/v1/records.json?app=${srcApp}&totalCount=true`;
  const getRes = await fetch(getUrl, {
    headers: { "X-Cybozu-API-Token": srcToken },
    cache: "no-store",
  });
  if (!getRes.ok) return NextResponse.json({ error: "来源 App 获取失败，请检查 App ID 和 Token" }, { status: 500 });

  const getData = await getRes.json();
  type KintoneRecord = Record<string, { value: string }>;
  const sourceRecords: KintoneRecord[] = (getData.records ?? []).slice(0, limit);

  if (sourceRecords.length === 0) {
    return NextResponse.json({ error: "来源 App 暂无记录" }, { status: 400 });
  }

  // ② システムフィールド（$で始まる）を除外してコピー用レコードを作成
  const copyRecords = sourceRecords.map(r => {
    const fields: Record<string, { value: string }> = {};
    for (const [key, val] of Object.entries(r)) {
      if (!key.startsWith("$") && key !== "レコード番号" && key !== "record_id") {
        fields[key] = val;
      }
    }
    return fields;
  });

  // ③ 目标 App へ一括登録（100件ずつ）
  let copied = 0;
  let failed = 0;
  const postUrl = `https://${subdomain}.cybozu.com/k/v1/records.json`;
  const chunkSize = 100;

  for (let i = 0; i < copyRecords.length; i += chunkSize) {
    const chunk = copyRecords.slice(i, i + chunkSize);
    const postRes = await fetch(postUrl, {
      method: "POST",
      headers: {
        "X-Cybozu-API-Token": dstToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app: dstApp, records: chunk }),
    });
    if (postRes.ok) copied += chunk.length;
    else failed += chunk.length;
  }

  return NextResponse.json({ copied, failed });
}
