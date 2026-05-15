import { NextResponse } from "next/server";

export async function GET() {
  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "获取失败" }, { status: 500 });
  const data = await res.json();
  const records = data.records.map((r: Record<string, { value: string }>) => ({
    case_no: r.case_no?.value ?? "",
    case_name: r.case_name?.value ?? "",
    client: r.client?.value ?? "",
    assignee: r.assignee?.value ?? "",
    amount: r.amount?.value ?? "0",
    status: r.status?.value ?? "",
  }));
  return NextResponse.json({ records });
}
