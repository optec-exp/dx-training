import { NextRequest, NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

// 要读取的字段列表
const FIELDS = [
  '当社案件番号', '顧客名', '案件テーマ',
  '操作ステータス', 'Mode', 'ETD', 'ETA',
  'AWB_NO', '作成日時', '$id',
];

export async function GET(req: NextRequest) {
  // 凭证未配置时报错
  if (!SUBDOMAIN || !APP_ID || !TOKEN) {
    return NextResponse.json(
      { error: 'Kintone 凭证未配置，请检查 .env.local' },
      { status: 500 }
    );
  }

  // 从 URL 读取前端传来的搜索/过滤参数
  const p      = req.nextUrl.searchParams;
  const search = p.get('search')?.trim() ?? '';   // 关键词
  const status = p.get('status') ?? '';            // 状态过滤
  const mode   = p.get('mode') ?? '';              // Mode 过滤
  const offset = parseInt(p.get('offset') ?? '0', 10); // 分页偏移

  // ── 核心知识点：动态拼接 Kintone 查询条件 ──────────────
  // 类似 SQL 的 WHERE 子句，多个条件用 and 连接
  const conditions: string[] = [];

  if (status && status !== '__empty__') {
    // 按状态过滤：操作ステータス in ("◆処理中")
    conditions.push(`操作ステータス in ("${status}")`);
  }
  if (mode) {
    // 按 Mode 过滤：Mode = "Export"
    conditions.push(`Mode = "${mode}"`);
  }
  if (search) {
    // 关键词搜索：多个字段用 or 连接
    conditions.push(
      `(当社案件番号 like "${search}" or 顧客名 like "${search}" or 案件テーマ like "${search}" or AWB_NO like "${search}")`
    );
  }

  // 拼成完整查询：WHERE条件 + 排序 + 分页
  const wherePart = conditions.length > 0 ? conditions.join(' and ') + ' ' : '';
  const query     = `${wherePart}order by $id desc limit 50 offset ${offset}`;
  // ─────────────────────────────────────────────────────────

  try {
    // 构建 Kintone REST API URL
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set('app', APP_ID);
    url.searchParams.set('query', query);
    // fields[] = 只读取需要的字段，减少数据量
    FIELDS.forEach(f => url.searchParams.append('fields[]', f));

    // 发请求时用 X-Cybozu-API-Token 认证头（不是 Bearer！）
    const res = await fetch(url.toString(), {
      headers: { 'X-Cybozu-API-Token': TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
