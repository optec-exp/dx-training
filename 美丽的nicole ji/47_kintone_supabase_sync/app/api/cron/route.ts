import { NextRequest, NextResponse } from "next/server";

// Vercel Cron 会定时调用这个接口
// 用 CRON_SECRET 验证，防止外部随意触发
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  // 验证请求来自 Vercel（不是随便什么人都能触发）
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 调用同步逻辑（复用 /api/sync 的核心函数）
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/sync`, {
      method: "POST",
    });
    const data = await res.json();

    console.log("[Cron] 定时同步完成:", data);
    return NextResponse.json({ ok: true, result: data });
  } catch (err) {
    console.error("[Cron] 定时同步失败:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
