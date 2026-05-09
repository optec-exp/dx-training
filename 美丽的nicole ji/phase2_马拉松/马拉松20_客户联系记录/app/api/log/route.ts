import { NextResponse } from "next/server";

const BASE = `https://${process.env.KINTONE_SUBDOMAIN}.cybozu.com/k/v1`;
const HEADERS = {
  "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN!,
  "Content-Type": "application/json",
};

// GET: 联系记录一览
export async function GET() {
  const url = `${BASE}/records.json?app=${process.env.KINTONE_APP_ID}&query=order by contact_date desc limit 100`;
  const res = await fetch(url, { headers: { "X-Cybozu-API-Token": process.env.KINTONE_API_TOKEN! }, cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Kintone 获取失败" }, { status: 500 });

  const data = await res.json();
  type KintoneRecord = Record<string, { value: string }>;

  const logs = data.records.map((r: KintoneRecord) => ({
    id: r.$id?.value ?? "",
    contact_date: r.contact_date?.value ?? r.$created_time?.value?.slice(0, 10) ?? "",
    company_name: r.company_name?.value ?? "",
    contact_name: r.contact_name?.value ?? "",
    contact_type: r.contact_type?.value ?? "",
    content: r.content?.value ?? "",
    next_action: r.next_action?.value ?? "",
    next_date: r.next_date?.value ?? "",
  }));

  return NextResponse.json({ logs });
}

// POST: 新增联系记录
export async function POST(req: Request) {
  const body = await req.json();
  const record = {
    contact_date: { value: body.contact_date },
    company_name: { value: body.company_name },
    contact_name: { value: body.contact_name },
    contact_type: { value: body.contact_type },
    content: { value: body.content },
    next_action: { value: body.next_action ?? "" },
    next_date: { value: body.next_date ?? "" },
  };

  const res = await fetch(`${BASE}/record.json`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ app: process.env.KINTONE_APP_ID, record }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: `Kintone 保存失败：${err?.message ?? res.status}` }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ id: data.id, saved: true });
}
