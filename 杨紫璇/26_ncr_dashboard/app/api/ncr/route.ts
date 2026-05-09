import { NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_NCR_APP_ID!;
const TOKEN     = process.env.KINTONE_NCR_TOKEN!;

const FIELDS = ["$id", "NCR番号", "発生日時", "NCR_発生分類", "ステータス"];

interface RawRecord {
  $id: { value: string };
  NCR番号: { value: string };
  発生日時: { value: string };
  NCR_発生分類: { value: string };
  ステータス: { value: string };
}

async function fetchPage(offset: number): Promise<RawRecord[]> {
  const url = new URL(`https://${SUBDOMAIN}.cybozu.com/k/v1/records.json`);
  url.searchParams.set("app", APP_ID);
  url.searchParams.set("query", `order by $id asc limit 500 offset ${offset}`);
  FIELDS.forEach(f => url.searchParams.append("fields[]", f));
  const res = await fetch(url.toString(), {
    headers: { "X-Cybozu-API-Token": TOKEN },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()).records ?? [];
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
    return NextResponse.json({ records: all });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
