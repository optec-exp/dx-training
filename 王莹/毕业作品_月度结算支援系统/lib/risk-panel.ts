import { getSupabaseAdmin } from "./supabase-server";

export interface RiskPanel {
  负毛利: { opt_no: string; business_scope: string; 毛利: number; 成本: number }[];
  异常大额: { opt_no: string; 成本: number; 倍数: number }[];
  重复成本: { opt_no: string; 供应商: string; 金额: number; 次数: number }[];
  长期挂账: { 客户: string; 金额: number }[];
}

async function pageAll(table: string, sel: string, eqCol?: string, eqVal?: string) {
  const sb = getSupabaseAdmin();
  const out: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(sel);
    if (eqCol) q = q.eq(eqCol, eqVal as string);
    const { data, error } = await q.range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...((data ?? []) as Record<string, unknown>[]));
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

  // 长期挂账：应收 90+ 超期，按客户
  const aging = await pageAll("ar_ap_aging", "客户供应商,金额,账龄桶,是否超期,类型", "类型", "应收");
  const cust = new Map<string, number>();
  for (const a of aging) {
    if (a["账龄桶"] === "90+" && a["是否超期"] === true) cust.set(String(a["客户供应商"] || ""), (cust.get(String(a["客户供应商"] || "")) || 0) + (Number(a["金额"]) || 0));
  }
  const 长期挂账 = [...cust].map(([客户, 金额]) => ({ 客户, 金额 })).sort((a, b) => b.金额 - a.金额).slice(0, 15);

  return { 负毛利, 异常大额, 重复成本, 长期挂账 };
}
