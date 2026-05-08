import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN;
const APP_ID = process.env.KINTONE_AWB_APP_ID;
const API_TOKEN = process.env.KINTONE_AWB_TOKEN;

const FIELDS = [
  "$id",
  "当社案件番号",
  "AWB_NO",
  "MAWB",
  "HAWB",
  "顧客名",
  "ETD",
  "ETA",
  "積込港",
  "仕向地",
  "操作ステータス",
  "Transport_Type",
  "案件取消",
];

export async function GET(req: NextRequest) {
  if (!SUBDOMAIN || !APP_ID || !API_TOKEN) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const { searchParams } = req.nextUrl;
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const customer = searchParams.get("customer");
  const status = searchParams.get("status");
  const awbNo = searchParams.get("awbNo");

  const conditions: string[] = [];
  if (dateFrom) conditions.push(`ETD >= "${dateFrom}"`);
  if (dateTo) conditions.push(`ETD <= "${dateTo}"`);
  if (customer && customer.trim()) conditions.push(`顧客名 like "${customer.trim()}"`);
  if (status && status !== "all") conditions.push(`操作ステータス in ("${status}")`);
  if (awbNo && awbNo.trim()) conditions.push(`AWB_NO like "${awbNo.trim()}"`);
  const caseNo = searchParams.get("caseNo");
  if (caseNo && caseNo.trim()) conditions.push(`当社案件番号 like "${caseNo.trim()}"`);

  const baseCondition = conditions.length > 0 ? conditions.join(" and ") : "";
  const fieldsParam = FIELDS.map((f) => `fields[]=${encodeURIComponent(f)}`).join("&");
  const headers = { "X-Cybozu-API-Token": API_TOKEN };

  // Cursor-based pagination: fetch all records
  const allRecords: unknown[] = [];
  let lastId = 0;

  while (true) {
    const cursorCondition = `$id > ${lastId}`;
    const fullCondition = baseCondition
      ? `${baseCondition} and ${cursorCondition}`
      : cursorCondition;
    const query = `${fullCondition} order by $id asc limit 100`;

    const url = `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${APP_ID}&query=${encodeURIComponent(query)}&${fieldsParam}`;

    const res = await fetch(url, { headers, cache: "no-store" });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const batch: {$id: {value: string}}[] = data.records;

    if (batch.length === 0) break;

    allRecords.push(...batch);
    lastId = parseInt(batch[batch.length - 1].$id.value, 10);

    if (batch.length < 100) break;
  }

  // Sort by ETD desc after fetching all
  (allRecords as {ETD: {value: string | null}}[]).sort((a, b) => {
    const da = a.ETD.value ?? "";
    const db = b.ETD.value ?? "";
    return db.localeCompare(da);
  });

  return NextResponse.json(allRecords);
}
