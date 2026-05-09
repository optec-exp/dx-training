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

  const clients = data.records.map((r: KintoneRecord) => ({
    id: r.$id?.value ?? "",
    company_name: r.company_name?.value ?? r.client?.value ?? "",
    contact_name: r.contact_name?.value ?? r.担当者名?.value ?? "",
    email: r.email?.value ?? r.メールアドレス?.value ?? "",
  }));

  return NextResponse.json({ clients });
}
