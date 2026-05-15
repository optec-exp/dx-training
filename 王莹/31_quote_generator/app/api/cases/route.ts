import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN;
const APP_ID = process.env.KINTONE_APP_ID;
const API_TOKEN = process.env.KINTONE_API_TOKEN;

const FIELDS = [
  "$id",
  "見積番号",
  "顧客名書出",
  "見積ステータス",
  "積込港",
  "仕向地",
  "見積日",
  "本件見積額",
  "社内担当者",
  "作成日時",
]
  .map((f) => `fields[]=${encodeURIComponent(f)}`)
  .join("&");

export async function GET() {
  if (!SUBDOMAIN || !APP_ID || !API_TOKEN) {
    return NextResponse.json({ error: "Missing Kintone env vars" }, { status: 500 });
  }

  const query = encodeURIComponent("order by 見積日 desc");
  const url = `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${APP_ID}&limit=100&query=${query}&${FIELDS}`;

  const res = await fetch(url, {
    headers: { "X-Cybozu-API-Token": API_TOKEN },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.records);
}
