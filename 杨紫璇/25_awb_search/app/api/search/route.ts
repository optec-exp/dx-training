import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

const FIELDS = [
  "$id", "AWB_NO", "当社案件番号", "顧客名", "案件テーマ",
  "操作ステータス", "Mode", "ETD", "ETA", "作成日時",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo   = searchParams.get("dateTo")   || "";
    const customer = searchParams.get("customer")?.trim() || "";
    const status   = searchParams.get("status")   || "";
    const offset   = parseInt(searchParams.get("offset") || "0", 10);
    const limit    = Math.min(parseInt(searchParams.get("limit") || "50", 10), 500);

    const conditions: string[] = [];

    if (dateFrom) conditions.push(`作成日時 >= "${dateFrom}T00:00:00+09:00"`);
    if (dateTo)   conditions.push(`作成日時 <= "${dateTo}T23:59:59+09:00"`);
    if (customer) conditions.push(`顧客名 like "${customer}"`);
    if (status)   conditions.push(`操作ステータス in ("${status}")`);

    const where = conditions.length > 0 ? conditions.join(" and ") + " " : "";
    const query = `${where}order by $id desc limit ${limit} offset ${offset}`;

    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set("app", APP_ID);
    url.searchParams.set("query", query);
    FIELDS.forEach(f => url.searchParams.append("fields[]", f));

    const res = await fetch(url.toString(), {
      headers: { "X-Cybozu-API-Token": TOKEN },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: res.status });
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
