// 加成率（Markup Rate = 利润/成本 = (收入-成本)/成本）审查 —— 可配置标准表。
// 业务参数常变，集中在此一处维护；改这里即可，无需动其它代码。

export const MARKUP_TOLERANCE = 0.10; // "大幅"容差：相对目标偏离 ±10%（相对比例）

// 标准目标值（业务规定，直接采用，不做毛利率↔加成率换算）。
// OBC 为条件单值：按"是否 6 小时内提货"取 150% / 100%。
type Target = { fixed: number } | { obc: { within6h: number; after: number } };

// key = `${business_scope}|${服务类型}`（服务类型含 AOG 前缀时按实际字段对齐）
export const MARKUP_TABLE: Record<string, Target> = {
  // Aerospace
  "Aerospace|ECO": { fixed: 0.40 },
  "Aerospace|AOG_NFO": { fixed: 0.55 },
  "Aerospace|AOG_OBC": { obc: { within6h: 1.50, after: 1.00 } },
  "Aerospace|Parts Procurement": { fixed: 0.35 },
  // Ship Spares
  "Ship Spares|ECO": { fixed: 0.40 },
  "Ship Spares|NFO": { fixed: 0.45 },
  "Ship Spares|OBC": { obc: { within6h: 1.50, after: 1.00 } },
  // Other
  "Other|ECO": { fixed: 0.45 },
  "Other|NFO": { fixed: 0.55 },
  "Other|OBC": { obc: { within6h: 1.50, after: 1.00 } },
};

// 取标准目标值。范围外（表中无）返回 null → 不审查（但仍计算实际加成率）。
export function getTargetMarkup(
  businessScope: string,
  serviceType: string,
  obcWithin6h: boolean | null
): number | null {
  const t = MARKUP_TABLE[`${businessScope}|${serviceType}`];
  if (!t) return null;
  if ("fixed" in t) return t.fixed;
  return obcWithin6h ? t.obc.within6h : t.obc.after;
}

export function actualMarkup(收入: number, 成本: number): number | null {
  if (!成本) return null;
  return (收入 - 成本) / 成本;
}

// 审查：相对目标偏离超过 ±TOLERANCE → 需审查（高低双向）。
export function needsReview(actual: number, target: number): boolean {
  const lower = target * (1 - MARKUP_TOLERANCE);
  const upper = target * (1 + MARKUP_TOLERANCE);
  return actual < lower || actual > upper;
}
