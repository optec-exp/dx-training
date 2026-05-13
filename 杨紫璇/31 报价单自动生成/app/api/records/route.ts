import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const where = q ? `顧客名ルックアップ like "${q}"` : "";
    const query = `${where} order by $id desc limit 20`.trim();

    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set("app", APP_ID);
    url.searchParams.set("query", query);
    url.searchParams.set("fields[0]", "$id");
    url.searchParams.set("fields[1]", "顧客名ルックアップ");
    url.searchParams.set("fields[2]", "見積番号");
    url.searchParams.set("fields[3]", "経路");
    url.searchParams.set("fields[4]", "見積ステータス");
    url.searchParams.set("fields[5]", "社内担当者");
    url.searchParams.set("fields[6]", "品名");

    const res = await fetch(url.toString(), {
      headers: { "X-Cybozu-API-Token": API_TOKEN },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message }, { status: 400 });
    return NextResponse.json({ records: data.records ?? [] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
