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

// 月度决算·银行残高（残高差额 = 期末 − 期初，按币种汇总）。
// 注：完整勾稽还需"现金净额(入金−出金)"按币种比对，待现金流同步(P1)。
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
