import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

const FIELDS = [
  "当社案件番号", "顧客名", "案件テーマ",
  "操作ステータス", "Mode", "ETD", "ETA",
  "AWB_NO", "作成日時", "$id",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "";
    const mode   = searchParams.get("mode")   || "";
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const conditions: string[] = [];

    if (status && status !== "__empty__") {
      conditions.push(`操作ステータス in ("${status}")`);
    }

    if (mode) {
      conditions.push(`Mode = "${mode}"`);
    }

    if (search) {
      conditions.push(
        `(当社案件番号 like "${search}" or 顧客名 like "${search}" or 案件テーマ like "${search}" or AWB_NO like "${search}")`
      );
    }

    const wherePart = conditions.length > 0 ? conditions.join(" and ") + " " : "";
    const queryStr = `${wherePart}order by $id desc limit 50 offset ${offset}`;

    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set("app", APP_ID);
    url.searchParams.set("query", queryStr);
    FIELDS.forEach((f) => url.searchParams.append("fields[]", f));

    const res = await fetch(url.toString(), {
      headers: { "X-Cybozu-API-Token": TOKEN },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
