import { getSupabaseAdmin } from "./supabase-server";

export interface BudgetData { 毛利: number | null; 贩管费: number | null; 净利: number | null }

export async function getBudget(month: string, 报表对象 = "全社"): Promise<BudgetData> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("budgets").select("项目,金额").eq("期间", month).eq("报表对象", 报表对象).in("项目", ["毛利", "贩管费", "净利"]);
  const out: BudgetData = { 毛利: null, 贩管费: null, 净利: null };
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const k = String(r["项目"]) as keyof BudgetData;
    if (k in out) out[k] = Number(r["金额"]);
  }
  return out;
}

// 批量：给定月份集合，按 报表对象 汇总预算（毛利/贩管费/净利）。一次查询。
export async function getBudgetsByObject(months: string[]): Promise<Record<string, BudgetData>> {
  const sb = getSupabaseAdmin();
  if (!months.length) return {};
  const { data } = await sb.from("budgets").select("报表对象,项目,金额").in("期间", months).in("项目", ["毛利", "贩管费", "净利"]);
  const out: Record<string, BudgetData> = {};
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const obj = String(r["报表对象"]); const k = String(r["项目"]) as keyof BudgetData;
    if (!out[obj]) out[obj] = { 毛利: null, 贩管费: null, 净利: null };
    if (k in out[obj]) out[obj][k] = (out[obj][k] || 0) + Number(r["金额"]);
  }
  return out;
}

export async function listBudgets(): Promise<{ 期间: string; 报表对象: string; 毛利: number | null; 贩管费: number | null; 净利: number | null }[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("budgets").select("*").in("项目", ["毛利", "贩管费", "净利"]);
  const m = new Map<string, { 期间: string; 报表对象: string; 毛利: number | null; 贩管费: number | null; 净利: number | null }>();
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const key = `${r["期间"]}|${r["报表对象"]}`;
    const e = m.get(key) || { 期间: String(r["期间"]), 报表对象: String(r["报表对象"]), 毛利: null, 贩管费: null, 净利: null };
    const k = String(r["项目"]) as "毛利" | "贩管费" | "净利";
    e[k] = Number(r["金额"]);
    m.set(key, e);
  }
  return [...m.values()].sort((a, b) => b.期间.localeCompare(a.期间) || a.报表对象.localeCompare(b.报表对象));
}
