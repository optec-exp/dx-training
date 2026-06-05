import { getSupabaseAdmin } from "./supabase-server";
import { getTargetMarkup, actualMarkup, needsReview, MARKUP_TOLERANCE } from "./markup";

export interface MarkupRow {
  opt_no: string;
  business_scope: string;
  服务类型: string;
  收入: number;
  成本: number;
  加成率: number | null;
  标准: number | null;
  偏离: number | null; // 相对目标偏离比例
  需审查: boolean;
}
export interface MarkupReport {
  month: string;
  active: boolean; // 加成率标准 2026-06 起生效；之前的月份不审查
  tolerance: number;
  rows: MarkupRow[]; // 仅"在标准表范围内"的案件（含需审查与正常）
  flagged: MarkupRow[]; // 需审查（超标）
  avgByScope: { scope: string; avg: number; count: number }[]; // 各 business_scope 月度平均加成率
  counts: { total: number; inScope: number; flagged: number };
}

// 加成率标准生效起始月（之前月份不审查）。
export const MARKUP_ACTIVE_FROM = "2026-06";

export async function getMarkupReport(month: string): Promise<MarkupReport> {
  const sb = getSupabaseAdmin();
  if (month < MARKUP_ACTIVE_FROM) {
    return { month, active: false, tolerance: MARKUP_TOLERANCE, rows: [], flagged: [], avgByScope: [], counts: { total: 0, inScope: 0, flagged: 0 } };
  }
  const { data, error } = await sb
    .from("kc_cases")
    .select("opt_no,business_scope,服务类型,obc_within_6h,毛利_日元,成本_日元,売上_日元")
    .eq("利润月", month);
  if (error) throw new Error(`读取 kc_cases 失败: ${error.message}`);

  const rows: MarkupRow[] = [];
  const flagged: MarkupRow[] = [];
  const scopeAgg = new Map<string, { sum: number; count: number }>();
  let inScope = 0;

  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const 成本 = Number(r["成本_日元"]) || 0;
    const 毛利 = Number(r["毛利_日元"]) || 0;
    const 收入 = Number(r["売上_日元"]) || 毛利 + 成本;
    const scope = String(r["business_scope"] ?? "");
    const svc = String(r["服务类型"] ?? "");
    const mk = actualMarkup(收入, 成本); // 利润/成本
    const target = getTargetMarkup(scope, svc, (r["obc_within_6h"] as boolean | null) ?? null);
    if (target == null || mk == null) continue; // 范围外/OBC挂起：不审查

    inScope++;
    const review = needsReview(mk, target);
    const dev = (mk - target) / target;
    const row: MarkupRow = { opt_no: String(r["opt_no"]), business_scope: scope, 服务类型: svc, 收入, 成本, 加成率: mk, 标准: target, 偏离: dev, 需审查: review };
    rows.push(row);
    if (review) flagged.push(row);
    const a = scopeAgg.get(scope) || { sum: 0, count: 0 };
    a.sum += mk; a.count++; scopeAgg.set(scope, a);
  }

  rows.sort((a, b) => Math.abs(b.偏离 ?? 0) - Math.abs(a.偏离 ?? 0));
  return {
    month,
    active: true,
    tolerance: MARKUP_TOLERANCE,
    rows,
    flagged,
    avgByScope: [...scopeAgg].map(([scope, v]) => ({ scope, avg: v.sum / v.count, count: v.count })),
    counts: { total: (data ?? []).length, inScope, flagged: flagged.length },
  };
}
