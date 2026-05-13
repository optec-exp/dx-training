import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID = process.env.KINTONE_APP_ID!;
const TOKEN = process.env.KINTONE_API_TOKEN!;

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 1) {
    return NextResponse.json({ items: [] });
  }

  try {
    const query = `支払先 like "${q}" order by 支払先 asc limit 20`;
    const url = `https://${SUBDOMAIN}.cybozu.com/k/v1/records.json?app=${APP_ID}&query=${encodeURIComponent(query)}&fields=支払先`;

    const res = await fetch(url, {
      headers: { "X-Cybozu-API-Token": TOKEN },
      cache: "no-store",
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ items: [] });
    }

    // 去重
    const seen = new Set<string>();
    const items: string[] = [];
    for (const record of data.records ?? []) {
      const val = record.支払先?.value as string;
      if (val && !seen.has(val)) {
        seen.add(val);
        items.push(val);
      }
    }

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
