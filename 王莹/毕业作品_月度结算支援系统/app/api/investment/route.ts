import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { logAudit } from "@/lib/audit";
import { getInvestmentAdvice } from "@/lib/treasury";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("investments").select("*").order("到期日", { ascending: true });
  let advice = null;
  try { advice = await getInvestmentAdvice(); } catch { advice = null; }
  return NextResponse.json({ rows: data ?? [], advice });
}

export async function POST(req: NextRequest) {
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("investments").insert({
      品种: b["品种"], 投资额: Number(b["投资额"]) || 0, 币种: b["币种"] || "JPY",
      收益率: Number(b["收益率"]) || 0, 到期日: b["到期日"] || null, 流动性: b["流动性"] || "", 状态: "持有", 来源: "手工",
    });
    if (error) throw new Error(error.message);
    await logAudit("投资录入", "investment", String(b["品种"] ?? ""), b);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
