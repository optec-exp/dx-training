import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to");

  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "获取失败" }, { status: 500 });
  const data = await res.json();

  let records = data.records as Record<string, { value: string }>[];
  if (from && to) {
    records = records.filter((r) => {
      const d = r["$created_time"]?.value?.slice(0, 10) ?? "";
      return d >= from && d <= to;
    });
  }

  const mapped = records.map((r) => ({
    case_no: r.case_no?.value ?? "",
    case_name: r.case_name?.value ?? "",
    client: r.client?.value ?? "",
    assignee: r.assignee?.value ?? "",
    amount: Number(r.amount?.value ?? 0),
    status: r.status?.value ?? "",
  }));

  const total = mapped.reduce((s, r) => s + r.amount, 0);
  return NextResponse.json({ records: mapped, total });
}
