export type SalesRecord = {
  顧客名: { value: string };
  請求日: { value: string };
  円換算売上合計: { value: string };
  円換算粗利益: { value: string };
  円換算費用合計: { value: string };
  Business_Scope: { value: string };
};

export type ScopeRow = {
  scope: string;
  sales: number;
  grossProfit: number;
  grossMarginPct: number;
  caseCount: number;
};

export type SgaRecord = {
  取引日: { value: string };
  費用項目: { value: string };
  円換算費用: { value: string };
};

export type MonthlyRow = {
  month: string; // "YYYY-MM"
  sales: number;
  grossProfit: number;
  sga: number;
  netProfit: number;
  caseCount: number;
  grossMarginPct: number; // 粗利益率 %
  sgaRatioPct: number;    // SGA / 売上 %
};

export type CustomerSalesRow = {
  name: string;
  sales: number;
  grossProfit: number;
};

export type MomRow = {
  label: string;
  current: number;
  previous: number;
  change: number; // %
};

export type SgaBreakdownRow = {
  month: string;
  total: number;
  items: Record<string, number>;
};

function toMonth(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function num(v: string | undefined): number {
  const n = parseFloat(v ?? "0");
  return isNaN(n) ? 0 : n;
}

export function aggregateSalesByMonth(records: SalesRecord[]): Map<string, { sales: number; grossProfit: number; caseCount: number }> {
  const map = new Map<string, { sales: number; grossProfit: number; caseCount: number }>();
  for (const r of records) {
    const m = toMonth(r.請求日?.value);
    if (!m) continue;
    const cur = map.get(m) ?? { sales: 0, grossProfit: 0, caseCount: 0 };
    cur.sales += num(r.円換算売上合計?.value);
    cur.grossProfit += num(r.円換算粗利益?.value);
    cur.caseCount += 1;
    map.set(m, cur);
  }
  return map;
}

export function aggregateSgaByMonth(records: SgaRecord[]): Map<string, { total: number; items: Record<string, number> }> {
  const map = new Map<string, { total: number; items: Record<string, number> }>();
  for (const r of records) {
    const m = toMonth(r.取引日?.value);
    if (!m) continue;
    const cost = num(r.円換算費用?.value);
    const item = r.費用項目?.value || "その他";
    const cur = map.get(m) ?? { total: 0, items: {} };
    cur.total += cost;
    cur.items[item] = (cur.items[item] ?? 0) + cost;
    map.set(m, cur);
  }
  return map;
}

export function buildMonthlyTrend(
  salesMap: Map<string, { sales: number; grossProfit: number; caseCount: number }>,
  sgaMap: Map<string, { total: number; items: Record<string, number> }>
): MonthlyRow[] {
  const allMonths = new Set([...salesMap.keys(), ...sgaMap.keys()]);
  const sorted = [...allMonths].sort();
  return sorted.map((month) => {
    const s = salesMap.get(month) ?? { sales: 0, grossProfit: 0, caseCount: 0 };
    const sga = sgaMap.get(month)?.total ?? 0;
    const grossMarginPct = s.sales !== 0 ? Math.round((s.grossProfit / s.sales) * 1000) / 10 : 0;
    const sgaRatioPct = s.sales !== 0 ? Math.round((sga / s.sales) * 1000) / 10 : 0;
    return {
      month,
      sales: Math.round(s.sales),
      grossProfit: Math.round(s.grossProfit),
      sga: Math.round(sga),
      netProfit: Math.round(s.grossProfit - sga),
      caseCount: s.caseCount,
      grossMarginPct,
      sgaRatioPct,
    };
  });
}

export function buildCustomerRanking(records: SalesRecord[]): CustomerSalesRow[] {
  const map = new Map<string, { sales: number; grossProfit: number }>();
  for (const r of records) {
    const name = r.顧客名?.value || "不明";
    const cur = map.get(name) ?? { sales: 0, grossProfit: 0 };
    cur.sales += num(r.円換算売上合計?.value);
    cur.grossProfit += num(r.円換算粗利益?.value);
    map.set(name, cur);
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, sales: Math.round(v.sales), grossProfit: Math.round(v.grossProfit) }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 10);
}

export function buildMoM(trend: MonthlyRow[]): { grossProfit: MomRow; netProfit: MomRow } | null {
  if (trend.length < 2) return null;
  const cur = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const pct = (c: number, p: number) => (p === 0 ? 0 : Math.round(((c - p) / Math.abs(p)) * 1000) / 10);
  return {
    grossProfit: { label: "粗利益", current: cur.grossProfit, previous: prev.grossProfit, change: pct(cur.grossProfit, prev.grossProfit) },
    netProfit: { label: "净利润", current: cur.netProfit, previous: prev.netProfit, change: pct(cur.netProfit, prev.netProfit) },
  };
}

export function buildSgaBreakdown(sgaMap: Map<string, { total: number; items: Record<string, number> }>): SgaBreakdownRow[] {
  return [...sgaMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, total: Math.round(v.total), items: v.items }));
}

export function buildScopeBreakdown(records: SalesRecord[]): ScopeRow[] {
  const map = new Map<string, { sales: number; grossProfit: number; caseCount: number }>();
  for (const r of records) {
    const scope = r.Business_Scope?.value || "未設定";
    const cur = map.get(scope) ?? { sales: 0, grossProfit: 0, caseCount: 0 };
    cur.sales += num(r.円換算売上合計?.value);
    cur.grossProfit += num(r.円換算粗利益?.value);
    cur.caseCount += 1;
    map.set(scope, cur);
  }
  return [...map.entries()]
    .map(([scope, v]) => ({
      scope,
      sales: Math.round(v.sales),
      grossProfit: Math.round(v.grossProfit),
      grossMarginPct: v.sales !== 0 ? Math.round((v.grossProfit / v.sales) * 1000) / 10 : 0,
      caseCount: v.caseCount,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit);
}

export function formatJPY(n: number): string {
  return "¥" + Math.round(n).toLocaleString("ja-JP");
}
