import { getSupabaseAdmin } from "./supabase-server";

export interface RiskPanel {
  负毛利: { opt_no: string; business_scope: string; 毛利: number; 成本: number }[];
  异常大额: { opt_no: string; 成本: number; 倍数: number }[];
  重复成本: { opt_no: string; 供应商: string; 金额: number; 次数: number }[];
  重复账单: { 供应商: string; 提单号: string; 金额: number; 币种: string; 次数: number }[];
  长期挂账: { 客户: string; 金额: number }[];
  坏账: { id: string; 客户: string; 金额: number; 备注: string; 标记时间: string }[];
}

async function pageAll(table: string, sel: string, eqCol?: string, eqVal?: string) {
  const sb = getSupabaseAdmin();
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(sel);
    if (eqCol) q = q.eq(eqCol, eqVal as string);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as unknown as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export async function getRiskPanel(month: string): Promise<RiskPanel> {
  const cases = await pageAll("kc_cases", "opt_no,business_scope,毛利_日元,成本_日元", "利润月", month);

  // 负毛利
  const 负毛利 = cases.filter((c) => Number(c["毛利_日元"]) < 0)
    .map((c) => ({ opt_no: String(c["opt_no"]), business_scope: String(c["business_scope"] || ""), 毛利: Number(c["毛利_日元"]) || 0, 成本: Number(c["成本_日元"]) || 0 }))
    .sort((a, b) => a.毛利 - b.毛利);

  // 异常大额：成本 > 当月均值 3 倍
  const costs = cases.map((c) => Number(c["成本_日元"]) || 0).filter((x) => x > 0);
  const mean = costs.length ? costs.reduce((s, x) => s + x, 0) / costs.length : 0;
  const 异常大额 = cases.filter((c) => mean > 0 && Number(c["成本_日元"]) > mean * 3)
    .map((c) => ({ opt_no: String(c["opt_no"]), 成本: Number(c["成本_日元"]) || 0, 倍数: +(Number(c["成本_日元"]) / mean).toFixed(1) }))
    .sort((a, b) => b.成本 - a.成本).slice(0, 20);

  // 重复成本：同 OPT+供应商+金额 出现多次
  const lines = await pageAll("kc_cost_lines", "opt_no,供应商,金额_原币");
  const dup = new Map<string, { opt_no: string; 供应商: string; 金额: number; 次数: number }>();
  for (const l of lines) {
    const key = `${l["opt_no"]}|${l["供应商"]}|${l["金额_原币"]}`;
    const e = dup.get(key) || { opt_no: String(l["opt_no"]), 供应商: String(l["供应商"] || ""), 金额: Number(l["金额_原币"]) || 0, 次数: 0 };
    e.次数++; dup.set(key, e);
  }
  const 重复成本 = [...dup.values()].filter((x) => x.次数 > 1 && x.金额 > 0).sort((a, b) => b.次数 - a.次数 || b.金额 - a.金额).slice(0, 20);

  // 重复账单：账单层 同 供应商+提单号(票号)+金额+币种 出现多次（漏录/重付风险）
  const bl = await pageAll("bill_lines", "供应商,提单号,金额_原币,原币种");
  const dupB = new Map<string, { 供应商: string; 提单号: string; 金额: number; 币种: string; 次数: number }>();
  for (const l of bl) {
    const tk = l["提单号"]; if (!tk) continue;
    const key = `${l["供应商"]}|${tk}|${l["金额_原币"]}|${l["原币种"]}`;
    const e = dupB.get(key) || { 供应商: String(l["供应商"] || ""), 提单号: String(tk), 金额: Number(l["金额_原币"]) || 0, 币种: String(l["原币种"] || ""), 次数: 0 };
    e.次数++; dupB.set(key, e);
  }
  const 重复账单 = [...dupB.values()].filter((x) => x.次数 > 1).sort((a, b) => b.次数 - a.次数 || b.金额 - a.金额).slice(0, 20);

  // 坏账标记（本系统维护，Kintone 无此功能）
  const bdRows = await pageAll("bad_debts", "id,客户,金额,备注,标记时间");
  const 坏账 = bdRows.map((x) => ({ id: String(x["id"]), 客户: String(x["客户"] || ""), 金额: Number(x["金额"]) || 0, 备注: String(x["备注"] || ""), 标记时间: String(x["标记时间"] || "") }))
    .sort((a, b) => b.标记时间.localeCompare(a.标记时间));
  const 坏账Set = new Set(坏账.map((x) => x.客户));

  // 长期挂账：应收 90+ 超期，按客户（已排除坏账客户）
  const aging = await pageAll("ar_ap_aging", "客户供应商,金额,账龄桶,是否超期,类型", "类型", "应收");
  const cust = new Map<string, number>();
  for (const a of aging) {
    if (a["账龄桶"] === "90+" && a["是否超期"] === true) cust.set(String(a["客户供应商"] || ""), (cust.get(String(a["客户供应商"] || "")) || 0) + (Number(a["金额"]) || 0));
  }
  const 长期挂账 = [...cust].filter(([k]) => !坏账Set.has(k)).map(([客户, 金额]) => ({ 客户, 金额 })).sort((a, b) => b.金额 - a.金额).slice(0, 15);

  return { 负毛利, 异常大额, 重复成本, 重复账单, 长期挂账, 坏账 };
}

// 海外代理对账差异趋势：按 供应商 × 月，统计差异笔数与差额合计（仅列有差异的代理）
export interface AgentDiffTrend {
  months: string[];
  rows: { 供应商: string; byMonth: Record<string, { 差异笔数: number; 差额: number }>; 总差异: number }[];
  hasDiff: boolean;
}
export async function getAgentDiffTrend(): Promise<AgentDiffTrend> {
  const recs = await pageAll("reconciliations", "供应商,利润月,差异类型,差额");
  const months = [...new Set(recs.map((r) => String(r["利润月"] || "")))].filter(Boolean).sort();
  const map = new Map<string, { 供应商: string; byMonth: Record<string, { 差异笔数: number; 差额: number }>; 总差异: number }>();
  for (const r of recs) {
    const 供应商 = String(r["供应商"] || "");
    if (!供应商) continue;
    let e = map.get(供应商);
    if (!e) { e = { 供应商, byMonth: {}, 总差异: 0 }; map.set(供应商, e); }
    const mm = String(r["利润月"] || "");
    const b = e.byMonth[mm] || { 差异笔数: 0, 差额: 0 };
    if (String(r["差异类型"]) !== "匹配") { b.差异笔数++; b.差额 += Math.abs(Number(r["差额"]) || 0); e.总差异++; }
    e.byMonth[mm] = b;
  }
  const rows = [...map.values()].filter((e) => e.总差异 > 0).sort((a, b) => b.总差异 - a.总差异);
  return { months, rows, hasDiff: rows.length > 0 };
}

// 多月异常趋势：按月统计案件级异常（负毛利 / 异常大额）
export interface RiskTrendRow { month: string; 负毛利: number; 异常大额: number }
export async function getRiskTrend(): Promise<RiskTrendRow[]> {
  const cases = await pageAll("kc_cases", "利润月,毛利_日元,成本_日元");
  const byM = new Map<string, Record<string, unknown>[]>();
  for (const c of cases) { const m = String(c["利润月"] || ""); if (!m) continue; (byM.get(m) ?? byM.set(m, []).get(m)!).push(c); }
  const out: RiskTrendRow[] = [];
  for (const [m, cs] of [...byM.entries()].sort()) {
    const neg = cs.filter((c) => Number(c["毛利_日元"]) < 0).length;
    const costs = cs.map((c) => Number(c["成本_日元"]) || 0).filter((x) => x > 0);
    const mean = costs.length ? costs.reduce((s, x) => s + x, 0) / costs.length : 0;
    const big = cs.filter((c) => mean > 0 && Number(c["成本_日元"]) > mean * 3).length;
    out.push({ month: m, 负毛利: neg, 异常大额: big });
  }
  return out;
}
