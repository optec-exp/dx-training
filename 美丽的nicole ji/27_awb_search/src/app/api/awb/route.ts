import { NextRequest, NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

const FIELDS = [
  '$id', '当社案件番号', '顧客名', '案件テーマ',
  '操作ステータス', 'Mode', 'ETD', 'ETA', 'AWB_NO', '作成日時',
];

export async function GET(req: NextRequest) {
  if (!SUBDOMAIN || !APP_ID || !TOKEN) {
    return NextResponse.json({ error: 'Kintone 凭证未配置' }, { status: 500 });
  }

  const p        = req.nextUrl.searchParams;
  const dateFrom = p.get('dateFrom') ?? '';   // ETD 开始日期  "2024-01-01"
  const dateTo   = p.get('dateTo')   ?? '';   // ETD 结束日期  "2024-12-31"
  const customer = p.get('customer') ?? '';   // 顧客名关键词
  const status   = p.get('status')   ?? '';   // 操作ステータス
  const mode     = p.get('mode')     ?? '';   // Mode
  const awb      = p.get('awb')      ?? '';   // AWB番号关键词
  const offset   = parseInt(p.get('offset') ?? '0', 10);

  // ── 核心知识点：Kintone 日期查询 ──────────────────────
  // ETD 字段是日期类型，查询格式必须是 "YYYY-MM-DD"
  // 大于等于用 >=，小于等于用 <=
  // 多个条件之间用 and 连接（复合搜索）
  const conditions: string[] = [];

  if (dateFrom) conditions.push(`ETD >= "${dateFrom}"`);
  if (dateTo)   conditions.push(`ETD <= "${dateTo}"`);
  if (customer) conditions.push(`顧客名 like "${customer}"`);
  if (status)   conditions.push(`操作ステータス in ("${status}")`);
  if (mode)     conditions.push(`Mode in ("${mode}")`);
  if (awb)      conditions.push(`AWB_NO like "${awb}"`);

  const wherePart = conditions.length > 0 ? conditions.join(' and ') + ' ' : '';
  const query     = `${wherePart}order by ETD desc limit 100 offset ${offset}`;

  try {
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set('app', APP_ID);
    url.searchParams.set('query', query);
    FIELDS.forEach(f => url.searchParams.append('fields[]', f));

    const res = await fetch(url.toString(), {
      headers: { 'X-Cybozu-API-Token': TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ records: data.records ?? [] });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
