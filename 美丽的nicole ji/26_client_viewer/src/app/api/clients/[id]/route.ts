import { NextRequest, NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

// 该客户详情页需要的字段
const FIELDS = [
  '$id', '当社案件番号', '顧客名', '案件テーマ',
  '操作ステータス', 'Mode', 'ETD', 'ETA', 'AWB_NO', '作成日時',
];

// ── 知识点：动态路由参数 ────────────────────────────────
// URL: /api/clients/[id]  → params.id 就是 URL 里的那段
// 例如 /api/clients/abc%20xyz → id = "abc xyz"（顧客名）
//
// 这里 id 实际上是 顧客名（URL encoded），不是数字 ID
// 因为 Kintone 没有"客户"这个独立应用，我们用顧客名来查案件

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientName = decodeURIComponent(id);  // URL 解码

  if (!SUBDOMAIN || !APP_ID || !TOKEN) {
    return NextResponse.json({ error: 'Kintone 凭证未配置' }, { status: 500 });
  }

  if (!clientName) {
    return NextResponse.json({ error: '客户名不能为空' }, { status: 400 });
  }

  try {
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set('app', APP_ID);
    // 查询该顧客名的全部案件，按 ID 倒序（最新在前）
    url.searchParams.set('query', `顧客名 = "${clientName}" order by $id desc limit 100`);
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
    return NextResponse.json({
      clientName,
      records: data.records ?? [],
    });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
