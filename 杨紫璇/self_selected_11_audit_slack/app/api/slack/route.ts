import { NextRequest, NextResponse } from "next/server";

const WEBHOOK = process.env.SLACK_WEBHOOK_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
