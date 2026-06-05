import { getCasesForMonth, getAvailableMonths } from "./data";
import { computeProfitReport } from "./profit";
import { getSgaForMonth } from "./sga";
import { getJpdeskHeads } from "./headcount";
import { getReceivablesAging } from "./treasury";

export interface DashboardData {
  months: string[];
  current: string;
  trend: { month: string; 毛利: number; 贩管费: number; 净利: number }[];
  全社净利: number; 中国净利: number; 日本净利: number;
  应收超期: number;
  pie中日: { name: string; value: number }[];
  pie贩管费: { name: string; value: number }[];
  小组: { name: string; 利润: number }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const all = await getAvailableMonths(); // 倒序
  const months = all.slice(0, 6).reverse(); // 取最近≤6个月，升序
  const current = months[months.length - 1] || "2026-05";

  const trend: DashboardData["trend"] = [];
  let cur = { 中国净利: 0, 日本净利: 0, 全社净利: 0, pie贩管费: [] as { name: string; value: number }[], 小组: [] as { name: string; 利润: number }[] };
  for (const m of months) {
    const cases = await getCasesForMonth(m);
    const heads = await getJpdeskHeads(m);
    const report = computeProfitReport(cases, m, heads);
    const sga = await getSgaForMonth(m);
    trend.push({ month: m, 毛利: Math.round(report.total), 贩管费: Math.round(sga.total), 净利: Math.round(report.total - sga.total) });
    if (m === current) {
      cur = {
        全社净利: report.total - sga.total,
        中国净利: report.china - sga.china,
        日本净利: report.japan - sga.japan,
        pie贩管费: Object.entries(sga.byCategory).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: Math.round(value) })),
        小组: report.groups.filter((g) => !g.indent).map((g) => ({ name: g.name, 利润: Math.round(g.total) })),
      };
    }
  }

  let 应收超期 = 0;
  try { 应收超期 = (await getReceivablesAging()).overdueAmt; } catch { /* ar 未同步 */ }

  return {
    months, current, trend,
    全社净利: cur.全社净利, 中国净利: cur.中国净利, 日本净利: cur.日本净利, 应收超期,
    pie中日: [{ name: "中国", value: Math.round(cur.中国净利) }, { name: "日本", value: Math.round(cur.日本净利) }],
    pie贩管费: cur.pie贩管费, 小组: cur.小组,
  };
}
