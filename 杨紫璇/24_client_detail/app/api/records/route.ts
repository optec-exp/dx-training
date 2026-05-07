import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

const FIELDS = [
  "$id", "当社案件番号", "顧客名", "案件テーマ",
  "操作ステータス", "Mode", "ETD", "ETA", "AWB_NO", "作成日時",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customer = searchParams.get("customer")?.trim() || "";
    const offset   = parseInt(searchParams.get("offset") || "0", 10);

    const where = customer ? `顧客名 like "${customer}"` : "";
    const query = `${where ? where + " " : ""}order by $id desc limit 50 offset ${offset}`;

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
