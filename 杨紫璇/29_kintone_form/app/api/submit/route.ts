import { NextRequest, NextResponse } from "next/server";

const SUBDOMAIN = process.env.KINTONE_SUBDOMAIN!;
const APP_ID    = process.env.KINTONE_APP_ID!;
const API_TOKEN = process.env.KINTONE_API_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 姓名, 电话, 生日 } = body;

    const record: Record<string, { value: string }> = {
      姓名: { value: 姓名 ?? "" },
      电话: { value: 电话 ?? "" },
      生日: { value: 生日 ?? "" },
    };

    const res = await fetch(
      `https://${SUBDOMAIN}.cybozu.com/k/v1/record.json`,
      {
        method: "POST",
        headers: {
          "X-Cybozu-API-Token": API_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ app: APP_ID, record }),
      }
    );

    const text = await res.text();
    let data: Record<string, string> = {};
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? text }, { status: 400 });
    }
    return NextResponse.json({ id: data.id, revision: data.revision });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
