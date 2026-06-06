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

// ⑦ 投资建议：HSBC USD 闲置 + 已投 + 未来应收应付净流入 → 建议可投额度(起投$100万)。
export interface InvestAdvice {
  hsbcUsd: number; hsbcJpy: number; rate: number; 已投USD: number;
  近期净现金流JPY: number; 近期净现金流USD: number; 可投USD: number; 笔数: number; 起投: number;
  状态: "充裕" | "需留存" | "不足"; 文案: string;
}
const 起投门槛 = 1_000_000;
export async function getInvestmentAdvice(): Promise<InvestAdvice> {
  const sb = getSupabaseAdmin();
  // HSBC USD 余额（最新月）
  const { data: bank } = await sb.from("kc_bank_balance").select("月份,期末残高,円換算残高").like("银行", "%HSBC%").eq("币种", "USD");
  const rows = (bank ?? []) as { 月份: string; 期末残高: number; 円換算残高: number }[];
  const latest = [...new Set(rows.map((b) => b.月份))].sort().slice(-1)[0] || "";
  const hb = rows.filter((b) => b.月份 === latest);
  const hsbcUsd = hb.reduce((s, b) => s + (Number(b.期末残高) || 0), 0);
  const hsbcJpy = hb.reduce((s, b) => s + (Number(b.円換算残高) || 0), 0);
  const rate = hsbcUsd ? hsbcJpy / hsbcUsd : 159;
  // 已投 USD
  const { data: inv } = await sb.from("investments").select("投资额,币种");
  const 已投USD = (inv ?? []).filter((i) => String((i as Record<string, unknown>)["币种"]).toUpperCase() === "USD").reduce((s, i) => s + (Number((i as Record<string, unknown>)["投资额"]) || 0), 0);
  // 未来应收应付净流入（已逾期+各月，排除未定）
  const fc = await getCashflowForecast();
  const 近期净JPY = fc.filter((r) => r.期间 !== "未定").reduce((s, r) => s + r.净流入, 0);
  const 近期净USD = 近期净JPY / rate;
  // 净流出时需留存；净流入时不留存（流动性会更宽裕）
  const reserveUSD = 近期净USD < 0 ? -近期净USD : 0;
  const 可投USD = Math.max(0, hsbcUsd - 已投USD - reserveUSD);
  const 笔数 = Math.floor(可投USD / 起投门槛);
  const 状态 = 可投USD < 起投门槛 ? "不足" : 近期净JPY < 0 ? "需留存" : "充裕";
  const f = (n: number) => "$" + Math.round(n).toLocaleString();
  const 文案 = 状态 === "不足"
    ? `可投余额 ${f(可投USD)} 未达起投门槛 $1,000,000，暂不宜新投。`
    : 状态 === "需留存"
      ? `未来应收应付净流出（需留存 ${f(reserveUSD)}），扣除后可投 ${f(可投USD)} ≈ ${笔数} 笔（每笔$100万）。`
      : `未来应收应付净流入（流动性充裕），HSBC闲置美金可投 ${f(可投USD)} ≈ ${笔数} 笔（每笔$100万）。`;
  return { hsbcUsd, hsbcJpy, rate, 已投USD, 近期净现金流JPY: Math.round(近期净JPY), 近期净现金流USD: Math.round(近期净USD), 可投USD: Math.round(可投USD), 笔数, 起投: 起投门槛, 状态, 文案 };
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
