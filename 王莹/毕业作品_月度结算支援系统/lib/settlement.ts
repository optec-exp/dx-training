import { getSupabaseAdmin } from "./supabase-server";

export interface BankRow {
  银行: string;
  币种: string;
  口座番号: string | null;
  期初残高: number | null;
  期末残高: number | null;
  残高差额: number | null;
  円換算残高: number | null;
  対象法人: string | null;
}
export interface SettlementReport {
  month: string;
  rows: BankRow[];
  byCurrency: { 币种: string; 差额: number; count: number }[];
  byLegal: { 法人: string; 残高差额: number; 円換算残高: number; count: number }[];
  円換算残高合计: number;
}

export interface CashConstituent { 业务出金: number; 贩管费出金: number }
export interface CashReconRow { 法人: string; 币种: string; 残高差额: number; 入金合计: number; 出金合计: number; 现金净额: number; 差异: number; 状态: string; 构成?: CashConstituent | null }
export async function getCashRecon(month: string): Promise<CashReconRow[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("settlement_checks").select("*").eq("利润月", month);
  return ((data ?? []) as unknown as CashReconRow[])
    // 法人→币种排序，不平排前
    .sort((a, b) => (b.状态 !== "平" ? 1 : 0) - (a.状态 !== "平" ? 1 : 0) || (a.法人 || "").localeCompare(b.法人 || "") || (a.币种 || "").localeCompare(b.币种 || ""));
}

// 月度决算·银行残高（残高差额 = 期末 − 期初，按币种/法人汇总）。
export async function getSettlement(month: string): Promise<SettlementReport> {
  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("kc_bank_balance").select("*").eq("月份", month);
  if (error) throw new Error(`读取 kc_bank_balance 失败: ${error.message}`);
  const rows = (data ?? []) as unknown as BankRow[];
  const agg = new Map<string, { 差额: number; count: number }>();
  const legal = new Map<string, { 残高差额: number; 円換算残高: number; count: number }>();
  let jpyTotal = 0;
  for (const r of rows) {
    const a = agg.get(r.币种) || { 差额: 0, count: 0 };
    a.差额 += Number(r.残高差额) || 0; a.count++; agg.set(r.币种, a);
    const lf = r.対象法人 || "其他";
    const l = legal.get(lf) || { 残高差额: 0, 円換算残高: 0, count: 0 };
    l.残高差额 += Number(r.残高差额) || 0; l.円換算残高 += Number(r.円換算残高) || 0; l.count++; legal.set(lf, l);
    jpyTotal += Number(r.円換算残高) || 0;
  }
  rows.sort((a, b) => (a.币种 || "").localeCompare(b.币种 || "") || (a.银行 || "").localeCompare(b.银行 || ""));
  return {
    month, rows,
    byCurrency: [...agg].map(([币种, v]) => ({ 币种, 差额: v.差额, count: v.count })).sort((a, b) => a.币种.localeCompare(b.币种)),
    byLegal: [...legal].map(([法人, v]) => ({ 法人, ...v })).sort((a, b) => a.法人.localeCompare(b.法人)),
    円換算残高合计: jpyTotal,
  };
}

// ⑥ 决算趋势：各月 残高差额合计 / 现金净额合计（多月对比）。
export async function getSettlementTrend(): Promise<{ 月份: string; 残高差额: number; 现金净额: number }[]> {
  const sb = getSupabaseAdmin();
  const { data } = await sb.from("settlement_checks").select("利润月,残高差额,现金净额");
  const m = new Map<string, { 残高差额: number; 现金净额: number }>();
  for (const r of (data ?? []) as { 利润月: string; 残高差额: number; 现金净额: number }[]) {
    const e = m.get(r.利润月) || { 残高差额: 0, 现金净额: 0 };
    e.残高差额 += Number(r.残高差额) || 0; e.现金净额 += Number(r.现金净额) || 0; m.set(r.利润月, e);
  }
  return [...m].map(([月份, v]) => ({ 月份, ...v })).sort((a, b) => a.月份.localeCompare(b.月份));
}

// ⑦ 资金管理用：各月「円換算残高合计（所有账户）」趋势。
export async function getBankBalanceTrend(): Promise<{ 月份: string; 円換算残高: number }[]> {
  const sb = getSupabaseAdmin();
  const all: { 月份: string; 円換算残高: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("kc_bank_balance").select("月份,円換算残高").range(from, from + 999);
    const d = (data ?? []) as typeof all;
    all.push(...d);
    if (d.length < 1000) break;
  }
  const m = new Map<string, number>();
  for (const r of all) m.set(r.月份, (m.get(r.月份) || 0) + (Number(r.円換算残高) || 0));
  return [...m].map(([月份, 円換算残高]) => ({ 月份, 円換算残高 })).sort((a, b) => a.月份.localeCompare(b.月份));
}
