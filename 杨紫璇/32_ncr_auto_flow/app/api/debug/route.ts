import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

export async function GET() {
  // 1. Fetch field definition for 発生部署 to see configured entities
  const fieldsRes = await fetch(
    `https://${SUBDOMAIN}.cybozu.com/k/v1/app/form/fields.json?app=${APP_ID}`,
    { headers: { "X-Cybozu-API-Token": API_TOKEN } }
  );
  const fieldsData = await fieldsRes.json();
  const deptField = fieldsData.properties?.発生部署;

  // 2. Fetch all unique 発生部署 codes from existing records (limit 100)
  const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
  url.searchParams.set("app", APP_ID);
  url.searchParams.set("query", "order by $id desc limit 100");
  url.searchParams.set("fields[0]", "$id");
  url.searchParams.set("fields[1]", "発生部署");
  url.searchParams.set("fields[2]", "発生部署部長");
  url.searchParams.set("fields[3]", "報告者");
  url.searchParams.set("fields[4]", "NCR番号");

  const res = await fetch(url.toString(), { headers: { "X-Cybozu-API-Token": API_TOKEN } });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.message }, { status: 400 });

  type OrgEntry = { code: string; name: string };
  const seen = new Map<string, string>();
  for (const r of (data.records ?? [])) {
    const arr = r.発生部署?.value as OrgEntry[] | undefined;
    if (arr?.[0]) seen.set(arr[0].code, arr[0].name);
  }

  return new NextResponse(JSON.stringify({
    発生部署_field_entities: deptField?.entities ?? "（フィールド設定なし）",
    unique_発生部署_in_records: Object.fromEntries(seen),
  }, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
