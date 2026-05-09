import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const threshold = Number(searchParams.get("threshold") ?? 5);

  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();
  type KintoneRecord = Record<string, { value: string }>;

  // 提取汇率记录
  const rawRecords = data.records
    .filter((r: KintoneRecord) => r.rate?.value && r.currency?.value)
    .map((r: KintoneRecord) => ({
      record_id: r.$id?.value ?? "",
      currency: r.currency?.value ?? "",
      rate: parseFloat(r.rate?.value ?? "0"),
      date: r.rate_date?.value ?? r.$created_time?.value?.slice(0, 10) ?? "",
    }));

  // 按货币分组，计算均值和偏差
  const byCurrency: Record<string, typeof rawRecords> = {};
  for (const r of rawRecords) {
    if (!byCurrency[r.currency]) byCurrency[r.currency] = [];
    byCurrency[r.currency].push(r);
  }

  const records = [];
  const summaries = [];

  for (const [currency, items] of Object.entries(byCurrency)) {
    const rates = items.map(i => i.rate);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    let anomalyCount = 0;

    for (const item of items) {
      const deviationPct = ((item.rate - avg) / avg) * 100;
      const isAnomaly = Math.abs(deviationPct) > threshold;
      if (isAnomaly) anomalyCount++;
      records.push({ ...item, deviation_pct: Math.round(deviationPct * 100) / 100, is_anomaly: isAnomaly });
    }

    summaries.push({
      currency,
      avg: Math.round(avg * 10000) / 10000,
      min,
      max,
      anomaly_count: anomalyCount,
    });
  }

  records.sort((a, b) => Math.abs(b.deviation_pct) - Math.abs(a.deviation_pct));

  return NextResponse.json({ records, summaries });
}
