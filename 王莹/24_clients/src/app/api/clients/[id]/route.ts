import { NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN;
const CLIENT_APP_ID = process.env.KINTONE_CLIENT_APP_ID;  // App #41
const CLIENT_TOKEN = process.env.KINTONE_CLIENT_TOKEN;
const CASE_APP_ID = process.env.KINTONE_CASE_APP_ID;      // App #1001
const CASE_TOKEN = process.env.KINTONE_CASE_TOKEN;

const CASE_FIELDS = ['$id', '顧客名', '当社案件番号', '請求日', '案件取消', '円換算粗利益']
  .map(f => `fields[]=${encodeURIComponent(f)}`)
  .join('&');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!SUBDOMAIN || !CLIENT_APP_ID || !CLIENT_TOKEN || !CASE_APP_ID || !CASE_TOKEN) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  // Step 1: App #41 からレコードIDで顧客名を取得
  const clientUrl = `https://${SUBDOMAIN}.cybozu.com/k/v1/record.json?app=${CLIENT_APP_ID}&id=${id}`;
  const clientRes = await fetch(clientUrl, {
    headers: { 'X-Cybozu-API-Token': CLIENT_TOKEN },
    cache: 'no-store',
  });

  if (!clientRes.ok) {
    const err = await clientRes.text();
    return NextResponse.json({ error: err }, { status: clientRes.status });
  }

  const clientData = await clientRes.json();
  const record = clientData.record;
  const clientName =
    record['会社名_現地名']?.value?.trim() ||
    record['会社名_英名']?.value?.trim() ||
    '';

  if (!clientName) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Step 2: App #1001 から顧客名で案件履歴を取得
  const query = encodeURIComponent(`顧客名 = "${clientName}" order by 請求日 desc`);
  const caseUrl = `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${CASE_APP_ID}&limit=500&query=${query}&${CASE_FIELDS}`;

  const caseRes = await fetch(caseUrl, {
    headers: { 'X-Cybozu-API-Token': CASE_TOKEN },
    cache: 'no-store',
  });

  if (!caseRes.ok) {
    const err = await caseRes.text();
    return NextResponse.json({ error: err }, { status: caseRes.status });
  }

  const caseData = await caseRes.json();

  return NextResponse.json({
    clientName,
    cases: caseData.records,
  });
}
