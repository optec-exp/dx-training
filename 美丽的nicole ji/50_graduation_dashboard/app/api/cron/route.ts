import { NextRequest, NextResponse } from "next/server";

// Vercel Cron 定时调用此接口，用 CRON_SECRET 验证
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/sync`, { method: "POST" });
    const data = await res.json();

    console.log("[Cron] 定时同步完成:", data);
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("[Cron] 定时同步失败:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
