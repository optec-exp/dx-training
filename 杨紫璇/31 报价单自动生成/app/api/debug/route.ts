import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

export async function GET() {
  const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
  url.searchParams.set("app", APP_ID);
  url.searchParams.set("query", "order by $id desc limit 1");

  const res = await fetch(url.toString(), {
    headers: { "X-Cybozu-API-Token": API_TOKEN },
  });
  const data = await res.json();
  const record = data.records?.[0] ?? {};

  const fields = Object.entries(record).map(([code, f]: [string, unknown]) => ({
    code,
    type: (f as { type?: string }).type,
    value: JSON.stringify((f as { value?: unknown }).value).substring(0, 80),
  }));

  return new NextResponse(JSON.stringify(fields, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
