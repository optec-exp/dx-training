import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const TOKEN     = process.env.KINTONE_API_TOKEN!;

interface RawRecord {
  $id: { value: string };
  顧客名: { value: string };
  当社案件番号: { value: string };
  操作ステータス: { value: string };
  Mode: { value: string };
  作成日時: { value: string };
}

async function fetchPage(offset: number): Promise<RawRecord[]> {
  const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
  url.searchParams.set("app", APP_ID);
  url.searchParams.set("query", `order by $id desc limit 500 offset ${offset}`);
  ["$id", "顧客名", "当社案件番号", "操作ステータス", "Mode", "作成日時"].forEach(
    f => url.searchParams.append("fields[]", f)
  );
  const res = await fetch(url.toString(), {
    headers: { "X-Cybozu-API-Token": TOKEN },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.records ?? [];
}

export async function GET() {
  try {
    let all: RawRecord[] = [];
    let offset = 0;
    while (true) {
      const page = await fetchPage(offset);
      all = all.concat(page);
      if (page.length < 500) break;
      offset += 500;
    }

    // Group by 顧客名
    const map = new Map<string, { count: number; latest: string; modes: Set<string> }>();
    for (const r of all) {
      const name = r.顧客名.value || "（未設定）";
      if (!map.has(name)) map.set(name, { count: 0, latest: "", modes: new Set() });
      const entry = map.get(name)!;
      entry.count++;
      if (!entry.latest || r.作成日時.value > entry.latest) entry.latest = r.作成日時.value;
      if (r.Mode.value) entry.modes.add(r.Mode.value);
    }

    const clients = Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        count: v.count,
        latest: v.latest,
        modes: Array.from(v.modes),
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ clients });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
