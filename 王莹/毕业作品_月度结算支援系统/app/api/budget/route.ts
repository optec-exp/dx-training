import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { listBudgets } from "@/lib/budget";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ rows: await listBudgets() });
}

export async function POST(req: NextRequest) {
  try {
    const { 期间, 报表对象, 毛利, 贩管费, 净利 } = (await req.json()) as { 期间: string; 报表对象: string; 毛利: number; 贩管费: number; 净利: number };
    if (!/^\d{4}-\d{2}$/.test(期间)) return NextResponse.json({ error: "期间格式 YYYY-MM" }, { status: 400 });
    const sb = getSupabaseAdmin();
    await sb.from("budgets").delete().eq("期间", 期间).eq("报表对象", 报表对象).in("项目", ["毛利", "贩管费", "净利"]);
    const { error } = await sb.from("budgets").insert([
      { 期间, 报表对象, 项目: "毛利", 金额: Number(毛利) || 0 },
      { 期间, 报表对象, 项目: "贩管费", 金额: Number(贩管费) || 0 },
      { 期间, 报表对象, 项目: "净利", 金额: Number(净利) || 0 },
    ]);
    if (error) throw new Error(error.message);
    await logAudit("预算录入", "budget", `${期间}/${报表对象}`, { 期间, 报表对象, 毛利, 贩管费, 净利 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
