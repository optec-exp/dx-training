import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { computeStats } from "@/lib/stats";

// 默认分析 2025-06-01 ~ 2026-05-31（与种子数据范围一致）
const DEFAULT_FROM = "2025-06-01";
const DEFAULT_TO   = "2026-05-31";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from") ?? DEFAULT_FROM;
  const to   = url.searchParams.get("to")   ?? DEFAULT_TO;

  try {
    const sb = getSupabaseAdmin();
    const stats = await computeStats(sb, { from, to });
    return NextResponse.json(stats);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
