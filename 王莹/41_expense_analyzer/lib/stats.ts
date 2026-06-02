import type { SupabaseClient } from "@supabase/supabase-js";

// —— 行级类型（DB → JS） ——
type Category = { id: string; code: string; name: string; description: string; sort_order: number };
type Expense  = { id: string; category_id: string; expense_date: string; department: string; vendor: string | null; amount: number; description: string | null };
type Budget   = { id: string; category_id: string; period: string; budget_amount: number };

// —— 输出类型（喂给 AI 的结构化数据） ——
export type AnomalyLineItem = {
  expenseDate: string;
  department: string;
  vendor: string | null;
  amount: number;
  description: string | null;
};

export type MonthlyStat = {
  period: string;            // YYYY-MM-01
  actual: number;             // 当月实际
  budget: number;             // 当月预算
  consumptionRate: number;    // actual / budget（budget=0 时为 0）
  overBudget: number;          // actual - budget（负数=结余）
  isStatisticalAnomaly: boolean;  // 是否超出"均值+2σ"（仅统计判定，是否真异常需结合 budget 上下文）
  topLineItems?: AnomalyLineItem[];  // 仅在 isStatisticalAnomaly=true 时附上该月该类目 Top3 明细，便于 AI 精准溯源
};

export type CategoryStat = {
  code: string;
  name: string;
  description: string;
  totalActual: number;
  totalBudget: number;
  consumptionRate: number;
  overBudgetAmount: number;       // 各月超支累计（仅取正值之和）
  monthlyMean: number;
  monthlyStdDev: number;
  anomalyThresholdHigh: number;   // mean + 2σ
  monthly: MonthlyStat[];
};

export type TopLineItem = {
  id: string;
  categoryCode: string;
  categoryName: string;
  expenseDate: string;
  department: string;
  vendor: string | null;
  amount: number;
  description: string | null;
};

export type AnalysisStats = {
  period: { from: string; to: string };
  summary: {
    totalActual: number;
    totalBudget: number;
    totalOverBudget: number;        // 各 类目×月 超支累计
    overBudgetCellsCount: number;    // (类目×月) 超支单元数
    anomalyCellsCount: number;       // (类目×月) 统计异常单元数
  };
  categories: CategoryStat[];
  topLineItems: TopLineItem[];
};

const monthKey = (isoDate: string) => isoDate.slice(0, 7) + "-01";

function enumerateMonths(from: string, to: string): string[] {
  const months: string[] = [];
  const start = new Date(from + "T00:00:00Z"); start.setUTCDate(1);
  const end = new Date(to + "T00:00:00Z");
  for (let d = new Date(start); d <= end; d.setUTCMonth(d.getUTCMonth() + 1)) {
    months.push(d.toISOString().slice(0, 10));
  }
  return months;
}

export async function computeStats(
  supabase: SupabaseClient,
  range: { from: string; to: string }
): Promise<AnalysisStats> {
  const [catsR, expsR, budsR] = await Promise.all([
    supabase.from("ex41_categories").select("*").order("sort_order"),
    supabase.from("ex41_expenses").select("*").gte("expense_date", range.from).lte("expense_date", range.to),
    supabase.from("ex41_budgets").select("*").gte("period", range.from).lte("period", range.to),
  ]);
  if (catsR.error) throw catsR.error;
  if (expsR.error) throw expsR.error;
  if (budsR.error) throw budsR.error;

  const categories = catsR.data as Category[];
  const expenses   = (expsR.data as Expense[]).map(e => ({ ...e, amount: Number(e.amount) }));
  const budgets    = (budsR.data as Budget[]).map(b => ({ ...b, budget_amount: Number(b.budget_amount) }));

  const months = enumerateMonths(range.from, range.to);
  const catNameById = new Map(categories.map(c => [c.id, c.name]));
  const catCodeById = new Map(categories.map(c => [c.id, c.code]));

  let totalActual = 0, totalBudget = 0, totalOverBudget = 0;
  let overBudgetCellsCount = 0, anomalyCellsCount = 0;

  const catStats: CategoryStat[] = categories.map(cat => {
    // 按月汇总实际
    const monthlyActual = new Map<string, number>(months.map(m => [m, 0]));
    for (const e of expenses) {
      if (e.category_id !== cat.id) continue;
      const k = monthKey(e.expense_date);
      if (monthlyActual.has(k)) monthlyActual.set(k, (monthlyActual.get(k) ?? 0) + e.amount);
    }
    // 按月取预算
    const monthlyBudget = new Map<string, number>(months.map(m => [m, 0]));
    for (const b of budgets) {
      if (b.category_id !== cat.id) continue;
      if (monthlyBudget.has(b.period)) monthlyBudget.set(b.period, b.budget_amount);
    }

    // 均值±2σ（总体标准差，N 不是 N-1，因为我们有完整12月样本）
    const actuals = months.map(m => monthlyActual.get(m) ?? 0);
    const mean = actuals.reduce((s, v) => s + v, 0) / actuals.length;
    const variance = actuals.reduce((s, v) => s + (v - mean) ** 2, 0) / actuals.length;
    const stdDev = Math.sqrt(variance);
    const thrHigh = mean + 2 * stdDev;

    let catActual = 0, catBudget = 0, catOver = 0;
    const monthly: MonthlyStat[] = months.map(m => {
      const actual = monthlyActual.get(m) ?? 0;
      const budget = monthlyBudget.get(m) ?? 0;
      const over = actual - budget;
      catActual += actual;
      catBudget += budget;
      if (over > 0) { catOver += over; overBudgetCellsCount += 1; }
      const isStatisticalAnomaly = actual > thrHigh;
      if (isStatisticalAnomaly) anomalyCellsCount += 1;

      // 异常月份附上该月该类目 Top3 明细，便于 AI 溯源
      let topLineItems: AnomalyLineItem[] | undefined;
      if (isStatisticalAnomaly) {
        const nextMonth = new Date(m + "T00:00:00Z");
        nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
        const nextMonthStr = nextMonth.toISOString().slice(0, 10);
        topLineItems = expenses
          .filter(e => e.category_id === cat.id && e.expense_date >= m && e.expense_date < nextMonthStr)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3)
          .map(e => ({
            expenseDate: e.expense_date,
            department: e.department,
            vendor: e.vendor,
            amount: e.amount,
            description: e.description,
          }));
      }

      return {
        period: m,
        actual,
        budget,
        consumptionRate: budget > 0 ? actual / budget : 0,
        overBudget: over,
        isStatisticalAnomaly,
        ...(topLineItems ? { topLineItems } : {}),
      };
    });

    totalActual += catActual;
    totalBudget += catBudget;
    totalOverBudget += catOver;

    return {
      code: cat.code,
      name: cat.name,
      description: cat.description,
      totalActual: catActual,
      totalBudget: catBudget,
      consumptionRate: catBudget > 0 ? catActual / catBudget : 0,
      overBudgetAmount: catOver,
      monthlyMean: Math.round(mean),
      monthlyStdDev: Math.round(stdDev),
      anomalyThresholdHigh: Math.round(thrHigh),
      monthly,
    };
  });

  // Top 10 大额明细（线条级异常候选）
  const topLineItems: TopLineItem[] = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(e => ({
      id: e.id,
      categoryCode: catCodeById.get(e.category_id) ?? "",
      categoryName: catNameById.get(e.category_id) ?? "",
      expenseDate: e.expense_date,
      department: e.department,
      vendor: e.vendor,
      amount: e.amount,
      description: e.description,
    }));

  return {
    period: { from: range.from, to: range.to },
    summary: { totalActual, totalBudget, totalOverBudget, overBudgetCellsCount, anomalyCellsCount },
    categories: catStats,
    topLineItems,
  };
}
