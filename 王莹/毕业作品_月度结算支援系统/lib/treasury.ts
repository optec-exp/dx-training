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

// ⑦ 投资建议：HSBC USD 闲置 + 已投 + 未来 USD 应收/应付（纯美金口径，不折算）→ 建议可投(起投$100万)。
export interface InvestAdvice {
  hsbcUsd: number; 已投USD: number; usd应收: number; usd应付: number; usd净流入: number;
  可投USD: number; 笔数: number; 起投: number; 状态: "充裕" | "需留存" | "不足"; 文案: string;
}
const 起投门槛 = 1_000_000;
export async function getInvestmentAdvice(): Promise<InvestAdvice> {
  const sb = getSupabaseAdmin();
  // HSBC USD 余额（最新月）
  const { data: bank } = await sb.from("kc_bank_balance").select("月份,期末残高").like("银行", "%HSBC%").eq("币种", "USD");
  const rows = (bank ?? []) as { 月份: string; 期末残高: number }[];
  const latest = [...new Set(rows.map((b) => b.月份))].sort().slice(-1)[0] || "";
  const hsbcUsd = rows.filter((b) => b.月份 === latest).reduce((s, b) => s + (Number(b.期末残高) || 0), 0);
  // 已投 USD：只算未到期（在投）。HSBC 余额已含在投，已到期资金已回流，不能重复计入。
  const today = new Date().toISOString().slice(0, 10);
  const { data: inv } = await sb.from("investments").select("投资额,币种,到期日");
  const invRows = (inv ?? []) as unknown as Record<string, unknown>[];
  const 已投USD = invRows.filter((r) => {
    const 到期 = r["到期日"] ? String(r["到期日"]) : "";
    return String(r["币种"]).toUpperCase() === "USD" && (!到期 || 到期 >= today);
  }).reduce((s, r) => s + (Number(r["投资额"]) || 0), 0);
  // 未来 USD 应收/应付（原币种=USD，原币金额）—— 只看美金，不折算
  const all: { 类型: string; 原币种: string; 原币金额: number }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data } = await sb.from("ar_ap_aging").select("类型,原币种,原币金额").range(from, from + 999);
    const d = (data ?? []) as typeof all;
    all.push(...d);
    if (d.length < 1000) break;
  }
  const isUsd = (c: string) => String(c || "").toUpperCase() === "USD";
  const usd应收 = all.filter((r) => r.类型 === "应收" && isUsd(r.原币种)).reduce((s, r) => s + (Number(r.原币金额) || 0), 0);
  const usd应付 = all.filter((r) => r.类型 === "应付" && isUsd(r.原币种)).reduce((s, r) => s + (Number(r.原币金额) || 0), 0);
  const usd净流入 = usd应收 - usd应付;
  // 未来净流出时需留存美金；净流入则不影响
  const reserveUSD = usd净流入 < 0 ? -usd净流入 : 0;
  const 可投USD = Math.max(0, hsbcUsd - 已投USD - reserveUSD);
  const 笔数 = Math.floor(可投USD / 起投门槛);
  const 状态 = 可投USD < 起投门槛 ? "不足" : usd净流入 < 0 ? "需留存" : "充裕";
  const f = (n: number) => "$" + Math.round(n).toLocaleString();
  const 文案 = 状态 === "不足"
    ? `HSBC 闲置美金 ${f(可投USD)} 未达起投门槛 $1,000,000，暂不宜新投。`
    : 状态 === "需留存"
      ? `未来 USD 应付>应收（需留存 ${f(reserveUSD)} 付款），扣除后可投 ${f(可投USD)} ≈ ${笔数} 笔（每笔$100万）。`
      : `未来 USD 应收>应付（美金回流，流动性充裕），HSBC 闲置美金可投 ${f(可投USD)} ≈ ${笔数} 笔（每笔$100万）。`;
  return { hsbcUsd: Math.round(hsbcUsd), 已投USD: Math.round(已投USD), usd应收: Math.round(usd应收), usd应付: Math.round(usd应付), usd净流入: Math.round(usd净流入), 可投USD: Math.round(可投USD), 笔数, 起投: 起投门槛, 状态, 文案 };
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
