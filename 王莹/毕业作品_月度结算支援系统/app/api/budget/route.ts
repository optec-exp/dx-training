import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { listBudgets } from "@/lib/budget";
import { logAudit } from "@/lib/audit";
import { getAvailableMonths, getCasesForMonth } from "@/lib/data";
import { computeProfitReport, buildGroupPL } from "@/lib/profit";
import { getSgaByDept } from "@/lib/sga";
import { getJpdeskHeads } from "@/lib/headcount";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await listBudgets();
  // 报表对象候选：法人 + 各业务部门 + 各管理部门（取最近已同步月份推导）
  let objects = ["全社", "中国", "日本"];
  try {
    const m = (await getAvailableMonths())[0];
    if (m) {
      const cases = await getCasesForMonth(m);
      if (cases.length) {
        const r = computeProfitReport(cases, m, await getJpdeskHeads(m));
        const gpl = buildGroupPL(r.groups, await getSgaByDept(m));
        objects = ["全社", "中国", "日本", ...gpl.business.map((b) => b.小组), ...gpl.mgmt.map((g) => g.部门)];
      }
    }
  } catch { /* 候选可选 */ }
  return NextResponse.json({ rows, objects });
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
