import { getSupabaseAdmin } from "./supabase-server";

export interface SyncCheckRow {
  opt_no: string;
  company: string;
  案件收入: number;
  入金合计: number;
  收入差异: number;
  案件成本: number;
  支付合计: number;
  成本差异: number;
  状态: string;
}
export interface SyncCheckReport {
  month: string;
  rows: SyncCheckRow[];
  summary: { total: number; 收入差异数: number; 成本差异数: number; 案件收入: number; 入金: number; 案件成本: number; 支付: number };
}

export async function getSyncCheck(month: string): Promise<SyncCheckReport> {
  const sb = getSupabaseAdmin();
  const all: SyncCheckRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("sync_checks").select("*").eq("利润月", month).range(from, from + 999);
    if (error) throw new Error(`读取 sync_checks 失败: ${error.message}`);
    all.push(...((data ?? []) as unknown as SyncCheckRow[]));
    if (!data || data.length < 1000) break;
  }
  const s = { total: all.length, 收入差异数: 0, 成本差异数: 0, 案件收入: 0, 入金: 0, 案件成本: 0, 支付: 0 };
  for (const r of all) {
    if (Math.abs(Number(r.收入差异)) > 1) s.收入差异数++;
    if (Math.abs(Number(r.成本差异)) > 1) s.成本差异数++;
    s.案件收入 += Number(r.案件收入) || 0; s.入金 += Number(r.入金合计) || 0;
    s.案件成本 += Number(r.案件成本) || 0; s.支付 += Number(r.支付合计) || 0;
  }
  // 差异排前
  all.sort((a, b) => (b.状态 === "差异" ? 1 : 0) - (a.状态 === "差异" ? 1 : 0) || Math.abs(Number(b.成本差异)) - Math.abs(Number(a.成本差异)));
  return { month, rows: all, summary: s };
}
