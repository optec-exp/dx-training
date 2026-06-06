import { getSupabaseAdmin } from "./supabase-server";

export interface AgingReport {
  total: number;
  overdueAmt: number;
  overdueCount: number;
  count: number;
  buckets: { bucket: string; amt: number; count: number }[];
  topCustomers: { name: string; amt: number }[];
}

const BUCKET_ORDER = ["0-30", "31-60", "61-90", "90+"];

export async function getReceivablesAging(): Promise<AgingReport> { return getAging("应收"); }
export async function getPayablesAging(): Promise<AgingReport> { return getAging("应付"); }

// ⑦ 现金流滚动预测：按预计收付日(支払期日)归月，应收−应付=净流入，累计。
export interface CFRow { 期间: string; 应收: number; 应付: number; 净流入: number; 累计净额: number }
export async function getCashflowForecast(refDate?: string): Promise<CFRow[]> {
  const sb = getSupabaseAdmin();
  const ref = refDate || new Date().toISOString().slice(0, 10);
  const all: { 类型: string; 金额: number; 预计收付日: string | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("ar_ap_aging").select("类型,金额,预计收付日").range(from, from + 999);
    const d = (data ?? []) as typeof all;
    all.push(...d);
    if (d.length < 1000) break;
  }
  const m = new Map<string, { 应收: number; 应付: number }>();
  for (const r of all) {
    const due = r.预计收付日;
    const key = !due ? "未定" : due < ref ? "已逾期" : due.slice(0, 7);
    const e = m.get(key) || { 应收: 0, 应付: 0 };
    if (r.类型 === "应收") e.应收 += Number(r.金额) || 0; else e.应付 += Number(r.金额) || 0;
    m.set(key, e);
  }
  const months = [...m.keys()].filter((k) => /^\d{4}-\d{2}$/.test(k)).sort();
  const order = [...(m.has("已逾期") ? ["已逾期"] : []), ...months, ...(m.has("未定") ? ["未定"] : [])];
  let cum = 0;
  return order.map((k) => { const e = m.get(k)!; const net = e.应收 - e.应付; cum += net; return { 期间: k, 应收: Math.round(e.应收), 应付: Math.round(e.应付), 净流入: Math.round(net), 累计净额: Math.round(cum) }; });
}

async function getAging(类型: "应收" | "应付"): Promise<AgingReport> {
  const sb = getSupabaseAdmin();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("ar_ap_aging").select("*").eq("类型", 类型).range(from, from + 999);
    if (error) throw new Error(`读取 ar_ap_aging 失败: ${error.message}`);
    rows.push(...((data ?? []) as Record<string, unknown>[]));
    if (!data || data.length < 1000) break;
  }
  const bk = new Map<string, { amt: number; count: number }>();
  const cust = new Map<string, number>();
  let total = 0, overdueAmt = 0, overdueCount = 0;
  for (const r of rows) {
    const amt = Number(r["金额"]) || 0;
    const bucket = String(r["账龄桶"]);
    const over = r["是否超期"] === true;
    total += amt;
    if (over) { overdueAmt += amt; overdueCount++; }
    const b = bk.get(bucket) || { amt: 0, count: 0 }; b.amt += amt; b.count++; bk.set(bucket, b);
    const cname = String(r["客户供应商"] || "(未知)"); cust.set(cname, (cust.get(cname) || 0) + amt);
  }
  return {
    total, overdueAmt, overdueCount, count: rows.length,
    buckets: BUCKET_ORDER.map((bucket) => ({ bucket, amt: bk.get(bucket)?.amt || 0, count: bk.get(bucket)?.count || 0 })),
    topCustomers: [...cust].map(([name, amt]) => ({ name, amt })).sort((a, b) => b.amt - a.amt).slice(0, 10),
  };
}
