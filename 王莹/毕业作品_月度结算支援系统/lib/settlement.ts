import { getSupabaseAdmin } from "./supabase-server";

export interface BankRow {
  银行: string;
  币种: string;
  期初残高: number | null;
  期末残高: number | null;
  残高差额: number | null;
}
export interface SettlementReport {
  month: string;
  rows: BankRow[];
  byCurrency: { 币种: string; 差额: number; count: number }[];
}

export interface CashReconRow { 币种: string; 残高差额: number; 入金合计: number; 出金合计: number; 现金净额: number; 差异: number; 状态: string }
export async function getCashRecon(month: string): Promise<CashReconRow[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("settlement_checks").select("*").eq("利润月", month);
  return ((data ?? []) as unknown as CashReconRow[]).sort((a, b) => Math.abs(b.差异) - Math.abs(a.差异));
}

// 月度决算·银行残高（残高差额 = 期末 − 期初，按币种汇总）。
export async function getSettlement(month: string): Promise<SettlementReport> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("kc_bank_balance").select("*").eq("月份", month);
  if (error) throw new Error(`读取 kc_bank_balance 失败: ${error.message}`);
  const rows = (data ?? []) as unknown as BankRow[];
  const agg = new Map<string, { 差额: number; count: number }>();
  for (const r of rows) {
    const a = agg.get(r.币种) || { 差额: 0, count: 0 };
    a.差额 += Number(r.残高差额) || 0; a.count++; agg.set(r.币种, a);
  }
  rows.sort((a, b) => (a.币种 || "").localeCompare(b.币种 || "") || (a.银行 || "").localeCompare(b.银行 || ""));
  return {
    month,
    rows,
    byCurrency: [...agg].map(([币种, v]) => ({ 币种, 差额: v.差额, count: v.count })).sort((a, b) => a.币种.localeCompare(b.币种)),
  };
}
