import { NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN;
const APP_ID = process.env.KINTONE_CLIENT_APP_ID;   // App #41
const API_TOKEN = process.env.KINTONE_CLIENT_TOKEN;

const FIELDS = ['$id', '会社名_現地名', '会社名_英名']
  .map(f => `fields[]=${encodeURIComponent(f)}`)
  .join('&');

const BATCH = 100;

type RawRecord = { $id: { value: string } };

async function fetchPage(subdomain: string, appId: string, token: string, lastId: number) {
  const query = encodeURIComponent(`$id > ${lastId} order by $id asc`);
  const url = `https://${subdomain}.cybozu.com/k/v1/records.json?app=${appId}&limit=${BATCH}&query=${query}&${FIELDS}`;
  const res = await fetch(url, {
    headers: { 'X-Cybozu-API-Token': token },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.records as RawRecord[];
}

export async function GET() {
  if (!SUBDOMAIN || !APP_ID || !API_TOKEN) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  try {
    const all: RawRecord[] = [];
    let lastId = 0;
    while (true) {
      const batch = await fetchPage(SUBDOMAIN, APP_ID, API_TOKEN, lastId);
      if (batch.length === 0) break;
      all.push(...batch);
      lastId = parseInt(batch[batch.length - 1].$id.value, 10);
      if (batch.length < BATCH) break;
    }
    return NextResponse.json(all);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
