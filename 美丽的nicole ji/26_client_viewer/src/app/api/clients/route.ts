import { NextResponse } from 'next/server';

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

// ── 知识点：获取唯一客户列表 ────────────────────────────
// Kintone 没有直接的 GROUP BY，所以我们：
// 1. 一次性读最多 500 条记录的顧客名字段
// 2. 在服务器端用 Set 去重
// 3. 按字母顺序排序后返回

export async function GET() {
  if (!SUBDOMAIN || !APP_ID || !TOKEN) {
    return NextResponse.json(
      { error: 'Kintone 凭证未配置' },
      { status: 500 }
    );
  }

  try {
    // 只读取顧客名字段（减少数据量）
    // limit 500 = 一次尽可能多读，获取更多不同的客户
    const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
    url.searchParams.set('app', APP_ID);
    url.searchParams.set('query', 'order by 顧客名 asc limit 500');
    url.searchParams.append('fields[]', '顧客名');
    url.searchParams.append('fields[]', '$id');

    const res = await fetch(url.toString(), {
      headers: { 'X-Cybozu-API-Token': TOKEN },
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const records: Array<{ 顧客名: { value: string }; $id: { value: string } }> =
      data.records ?? [];

    // ── 去重：用 Map 保存 顧客名 → 最小 $id ────────────
    // Map<顧客名, id>
    const clientMap = new Map<string, string>();
    for (const r of records) {
      const name = r.顧客名?.value?.trim();
      if (name && !clientMap.has(name)) {
        clientMap.set(name, r.$id.value);
      }
    }

    // 转成数组，按名称排序
    const clients = Array.from(clientMap.entries())
      .map(([name, id]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    return NextResponse.json({ clients });

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '请求失败' },
      { status: 500 }
    );
  }
}
