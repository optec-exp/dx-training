import { getCasesForMonth, getAvailableMonths } from "./data";
import { computeProfitReport } from "./profit";
import { getSgaForMonth } from "./sga";
import { getJpdeskHeads } from "./headcount";
import { getReceivablesAging } from "./treasury";
import { getPendingReconciliations } from "./reconcile";

export interface DashboardData {
  available: string[];          // 已同步月份（升序）
  selected: string[];           // 选定期间
  periodLabel: string;
  // 期间汇总
  毛利: number; 贩管费: number; 净利: number; 净利率: number;
  中国净利: number; 日本净利: number; 应收超期: number;
  // 环比（最新月 vs 上一月）
  环比净利: number | null;
  // 预警
  负毛利数: number; 对账待处理: number;
  // 图表
  trend: { month: string; 毛利: number; 贩管费: number; 净利: number; 净利率: number }[];
  pie中日: { name: string; value: number }[];
  pie贩管费: { name: string; value: number }[];
  小组: { name: string; 利润: number }[];
}

// 财年：4月起。给定月返回其财年的 [起,止]（如 2026-05 → 2026-04 ~ 2027-03）。
function fyRange(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const fy = m >= 4 ? y : y - 1;
  return [`${fy}-04`, `${fy + 1}-03`];
}
function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

interface Fig { 毛利: number; 贩管费: number; 净利: number; 中国净: number; 日本净: number; byCat: Record<string, number>; 小组: { name: string; 利润: number }[] }
async function monthFig(month: string): Promise<Fig | null> {
  const cases = await getCasesForMonth(month);
  if (cases.length === 0) return null;
  const r = computeProfitReport(cases, month, await getJpdeskHeads(month));
  const s = await getSgaForMonth(month);
  return {
    毛利: r.total, 贩管费: s.total, 净利: r.total - s.total,
    中国净: r.china - s.china, 日本净: r.japan - s.japan,
    byCat: s.byCategory,
    小组: r.groups.filter((g) => !g.indent).map((g) => ({ name: g.name, 利润: g.total })),
  };
}

export async function getDashboard(selected?: string[]): Promise<DashboardData> {
  const available = (await getAvailableMonths()).sort();
  const latest = (selected?.length ? [...selected] : available).sort().slice(-1)[0] || "2026-05";
  const [fyFrom, fyTo] = fyRange(latest);
  const fyMonths = available.filter((m) => m >= fyFrom && m <= fyTo);
  // 默认：财年累计到最新月
  const months = (selected?.length ? selected.filter((m) => available.includes(m)) : fyMonths.filter((m) => m <= latest)).sort();

  // 需要计算的月份：选定 + 财年(趋势) + 上一月(环比)
  const need = new Set<string>([...months, ...fyMonths, prevMonth(latest)]);
  const fig = new Map<string, Fig>();
  for (const m of need) { const f = await monthFig(m); if (f) fig.set(m, f); }

  // 期间汇总
  const agg = { 毛利: 0, 贩管费: 0, 净利: 0, 中国净: 0, 日本净: 0 };
  const cat = new Map<string, number>(); const grp = new Map<string, number>();
  for (const m of months) {
    const f = fig.get(m); if (!f) continue;
    agg.毛利 += f.毛利; agg.贩管费 += f.贩管费; agg.净利 += f.净利; agg.中国净 += f.中国净; agg.日本净 += f.日本净;
    for (const [k, v] of Object.entries(f.byCat)) cat.set(k, (cat.get(k) || 0) + v);
    for (const g of f.小组) grp.set(g.name, (grp.get(g.name) || 0) + g.利润);
  }

  // 环比：最新月 vs 上一月 净利
  const curF = fig.get(latest), prevF = fig.get(prevMonth(latest));
  const 环比净利 = curF && prevF && prevF.净利 ? (curF.净利 - prevF.净利) / Math.abs(prevF.净利) : null;

  // 预警
  const latestCases = await getCasesForMonth(latest);
  const 负毛利数 = latestCases.filter((c) => Number(c.毛利_日元) < 0).length;
  let 应收超期 = 0; try { 应收超期 = (await getReceivablesAging()).overdueAmt; } catch { /* */ }
  let 对账待处理 = 0; try { 对账待处理 = (await getPendingReconciliations()).length; } catch { /* */ }

  const periodLabel = months.length === 0 ? "无" : months.length === 1 ? months[0] : `${months[0]} ~ ${months[months.length - 1]}（${months.length}个月）`;

  return {
    available, selected: months, periodLabel,
    毛利: agg.毛利, 贩管费: agg.贩管费, 净利: agg.净利, 净利率: agg.毛利 ? agg.净利 / agg.毛利 : 0,
    中国净利: agg.中国净, 日本净利: agg.日本净, 应收超期,
    环比净利, 负毛利数, 对账待处理,
    trend: fyMonths.map((m) => { const f = fig.get(m); return { month: m, 毛利: Math.round(f?.毛利 || 0), 贩管费: Math.round(f?.贩管费 || 0), 净利: Math.round(f?.净利 || 0), 净利率: f && f.毛利 ? +((f.净利 / f.毛利) * 100).toFixed(1) : 0 }; }),
    pie中日: [{ name: "中国", value: Math.round(agg.中国净) }, { name: "日本", value: Math.round(agg.日本净) }],
    pie贩管费: [...cat].filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: Math.round(value) })),
    小组: [...grp].map(([name, 利润]) => ({ name, 利润: Math.round(利润) })),
  };
}
