import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // 格式: 2026-05

  // 获取 Kintone 所有记录
  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}&totalCount=true`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });
  }

  const data = await res.json();
  let records = data.records as Record<string, { value: string }>[];

  // 如果指定月份，则过滤（Kintone 创建时间字段 $created_time 格式: 2026-05-08T...）
  if (month) {
    records = records.filter((r) => {
      const created = r["$created_time"]?.value ?? "";
      return created.startsWith(month);
    });
  }

  // 按客户分组统计
  const clientMap: Record<string, { count: number; total: number; cases: string[] }> = {};
  for (const r of records) {
    const client = r.client?.value || "未知客户";
    const amount = Number(r.amount?.value || 0);
    const caseName = r.case_name?.value || "-";
    if (!clientMap[client]) {
      clientMap[client] = { count: 0, total: 0, cases: [] };
    }
    clientMap[client].count++;
    clientMap[client].total += amount;
    clientMap[client].cases.push(caseName);
  }

  // 转为数组并按金额降序
  const clients = Object.entries(clientMap)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = clients.reduce((s, c) => s + c.total, 0);

  return NextResponse.json({ clients, grandTotal, recordCount: records.length });
}
