import { NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN;
const APP_ID = process.env.KINTONE_CLIENT_APP_ID;   // App #41
const API_TOKEN = process.env.KINTONE_CLIENT_TOKEN;

const FIELDS = ['$id', '会社名_現地名', '会社名_英名']
  .map(f => `fields[]=${encodeURIComponent(f)}`)
  .join('&');

export async function GET() {
  if (!SUBDOMAIN || !APP_ID || !API_TOKEN) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const query = encodeURIComponent('order by $id asc');
  const url = `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${APP_ID}&limit=500&query=${query}&${FIELDS}`;

  const res = await fetch(url, {
    headers: { 'X-Cybozu-API-Token': API_TOKEN },
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data.records);
}
