import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_SALES_APP_ID!;
const TOKEN = process.env.KINTONE_SALES_TOKEN!;

const FIELDS = [
  "$id",
  "顧客名",
  "請求日",
  "円換算売上合計",
  "円換算粗利益",
  "円換算費用合計",
  "納品完了",
  "請求確定",
  "CS費用入力完了",
  "費用確定",
  "Business_Scope",
];

type KintoneRecord = Record<string, { value: unknown }>;

function isChecked(field: { value: unknown }): boolean {
  if (!field) return false;
  const v = field.value;
  if (Array.isArray(v)) return v.length > 0;
  return v === "true" || v === true;
}

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
    const all = await fetchAllRecords();

    const valid = all.filter((r) => {
      const kanryou = isChecked(r["納品完了"] as { value: unknown });
      const seikakuTei = isChecked(r["請求確定"] as { value: unknown });
      const csFee = isChecked(r["CS費用入力完了"] as { value: unknown });
      const hiyouKakutei = (r["費用確定"]?.value as string) === "確定済";
      return kanryou && seikakuTei && csFee && hiyouKakutei;
    });

    return NextResponse.json({ records: valid, total: all.length, valid: valid.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
