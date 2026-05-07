import { NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

// 读取所有记录的操作ステータス字段，去重后返回
export async function GET() {
  if (!SUBDOMAIN || !APP_ID || !TOKEN) {
    return NextResponse.json({ error: 'Kintone 凭证未配置' }, { status: 500 });
  }

  try {
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set('app', APP_ID);
    url.searchParams.set('query', 'order by 操作ステータス asc limit 500');
    url.searchParams.append('fields[]', '操作ステータス');

    const res = await fetch(url.toString(), {
      headers: { 'X-Cybozu-API-Token': TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const records: Array<{ 操作ステータス: { value: string } }> = data.records ?? [];

    // 去重
    const statuses = Array.from(
      new Set(records.map(r => r.操作ステータス?.value).filter(Boolean))
    ).sort() as string[];

    return NextResponse.json({ statuses });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
