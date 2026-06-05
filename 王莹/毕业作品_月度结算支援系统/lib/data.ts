import { getSupabaseAdmin } from "./supabase-server";
import type { CaseRow } from "./profit";

// 读取某利润月的案件（settlement.kc_cases）。客户端已指向 settlement schema。
export async function getCasesForMonth(month: string): Promise<CaseRow[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("kc_cases").select("*").eq("利润月", month);
  if (error) throw new Error(`读取 kc_cases 失败: ${error.message}`);
  return (data ?? []) as unknown as CaseRow[];
}

// 已同步的利润月列表（去重，倒序）。
export async function getAvailableMonths(): Promise<string[]> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("kc_cases").select("利润月");
  if (error) throw new Error(error.message);
  const set = new Set<string>();
  for (const r of data ?? []) {
    const m = (r as Record<string, unknown>)["利润月"];
    if (typeof m === "string" && m) set.add(m);
  }
  return Array.from(set).sort().reverse();
}
