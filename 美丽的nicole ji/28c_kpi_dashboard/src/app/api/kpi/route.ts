import { NextRequest, NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

const FIELDS = [
  '$id', '顧客名', '操作ステータス', 'Mode', 'ETD', 'ETA', 'AWB_NO',
];

// Kintone は 1回のリクエストで最大 500 件しか取れないため、
// offset をずらしながら全件取得する
async function fetchAll(query: string): Promise<Record<string, { value: string }>[]> {
  const all: Record<string, { value: string }>[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set('app', APP_ID);
    url.searchParams.set('query', `${query} limit ${limit} offset ${offset}`);
    FIELDS.forEach(f => url.searchParams.append('fields[]', f));

    const res = await fetch(url.toString(), {
      headers: { 'X-Cybozu-API-Token': TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const data = await res.json();
    const records = data.records ?? [];
    all.push(...records);

    // 返回数量 < limit，说明已经取完了
    if (records.length < limit) break;
    offset += limit;
  }

  return all;
}

export async function GET(req: NextRequest) {
  if (!SUBDOMAIN || !APP_ID || !TOKEN) {
    return NextResponse.json({ error: 'Kintone 凭证未配置' }, { status: 500 });
  }

  const p        = req.nextUrl.searchParams;
  const dateFrom = p.get('dateFrom') ?? '';
  const dateTo   = p.get('dateTo')   ?? '';

  // ── 按 ETA（纳品完了日）筛选期间 ──────────────────────
  const conditions: string[] = [];
  if (dateFrom) conditions.push(`ETA >= "${dateFrom}"`);
  if (dateTo)   conditions.push(`ETA <= "${dateTo}"`);

  const where = conditions.length > 0 ? conditions.join(' and ') + ' ' : '';
  const query = `${where}order by ETA asc`;

  try {
    const records = await fetchAll(query);
    return NextResponse.json({ records });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
