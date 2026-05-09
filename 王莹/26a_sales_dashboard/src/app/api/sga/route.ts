import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_SGA_APP_ID!;
const TOKEN = process.env.KINTONE_SGA_TOKEN!;

const FIELDS = ["$id", "取引日", "費用項目", "円換算費用"];

type KintoneRecord = Record<string, { value: unknown }>;

async function fetchAllRecords(): Promise<KintoneRecord[]> {
  const baseUrl = `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`;
  const records: KintoneRecord[] = [];
  let lastId = 0;

  while (true) {
    const q = `$id > ${lastId} order by $id asc limit 100`;
    const url = `${baseUrl}?app=${APP_ID}&query=${encodeURIComponent(q)}&fields=${FIELDS.join(",")}`;
    const res = await fetch(url, {
      headers: { "X-Cybozu-API-Token": TOKEN },
      cache: "no-store",
    });
    const data = await res.json();
    if (!data.records || data.records.length === 0) break;
    records.push(...data.records);
    if (data.records.length < 100) break;
    lastId = Number(data.records[data.records.length - 1].$id?.value ?? 0);
  }

  return records;
}

export async function GET() {
  try {
    const records = await fetchAllRecords();
    return NextResponse.json({ records });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
