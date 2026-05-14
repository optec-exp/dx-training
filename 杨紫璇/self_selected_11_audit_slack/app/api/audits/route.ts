import { NextRequest, NextResponse } from "next/server";

const DOMAIN   = process.env.KINTONE_DOMAIN!;
const APP_ID   = process.env.KINTONE_APP_ID!;
const TOKEN    = process.env.KINTONE_API_TOKEN!;

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const query = `月度内审日期 = "${date}"`;
  const url = `https://${DOMAIN}.cybozu.com/k/v1/records.json?app=${APP_ID}&query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: { "X-Cybozu-API-Token": TOKEN },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    if (data.records?.[0]) {
      console.log("Kintone fields:", JSON.stringify(data.records[0], null, 2));
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
