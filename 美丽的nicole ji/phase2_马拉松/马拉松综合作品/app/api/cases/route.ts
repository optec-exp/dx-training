import { NextResponse } from "next/server";

export async function GET() {
  const url = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${process.env.KINTONE_APP_ID}`;
  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! },
    cache: "no-store",
  });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();
  type KintoneRecord = Record<string, { value: string }>;

  const cases = data.records.map((r: KintoneRecord) => ({
    id: r.$id?.value ?? "",
    case_no: r.case_no?.value ?? "",
    case_name: r.case_name?.value ?? "",
    client: r.client?.value ?? "",
    description: r.description?.value ?? r.内容?.value ?? "",
  }));

  return NextResponse.json({ cases });
}
