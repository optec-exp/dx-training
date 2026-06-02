import type { AnalysisStats } from "@/lib/stats";

// —— AI 输出的目标结构 ——
export type Anomaly = {
  category: string;
  period: string;        // YYYY-MM
  amount: number;
  budget: number;
  isPlanned: boolean;    // true=计划内（季节性/事件性，预算已覆盖），不算真异常
  reason: string;        // 必须引用具体凭据（日期·供应商·金额·摘要）
  evidence: string;
};
export type Trend = {
  category: string;
  direction: "上升" | "下降" | "平稳" | "波动";
  description: string;
};
export type Recommendation = {
  priority: "高" | "中" | "低";
  title: string;
  action: string;          // 具体可执行
  expectedImpact: string;  // 预期影响/节省
};
export type AnalysisResult = {
  summary: string;
  anomalies: Anomaly[];
  trends: Trend[];
  recommendations: Recommendation[];
};

// —— Gemini responseSchema（OpenAPI 3.0 子集） ——
export const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "整体摘要，2-3 句话，点出最关键的发现" },
    anomalies: {
      type: "array",
      description: "针对每一个被代码圈出的统计异常单元，给出判定与解释。如果实际在预算内且属计划内事件（奖金、展会等），isPlanned 应设为 true。",
      items: {
        type: "object",
        properties: {
          category:  { type: "string", description: "类目中文名" },
          period:    { type: "string", description: "YYYY-MM" },
          amount:    { type: "number", description: "当月实际（円）" },
          budget:    { type: "number", description: "当月预算（円）" },
          isPlanned: { type: "boolean", description: "true=计划内不需处理；false=真异常需关注" },
          reason:    { type: "string", description: "原因，必须引用具体凭据" },
          evidence:  { type: "string", description: "支撑明细，如 2025-11-14 设备维修服务 ¥1,500,000 空调维修" },
        },
        required: ["category", "period", "amount", "budget", "isPlanned", "reason", "evidence"],
      },
    },
    trends: {
      type: "array",
      description: "各类目趋势判断。基于12个月的逐月数据。",
      items: {
        type: "object",
        properties: {
          category:    { type: "string" },
          direction:   { type: "string", enum: ["上升", "下降", "平稳", "波动"] },
          description: { type: "string", description: "趋势描述，包含具体数字（如：广告基数从¥60万/月升至¥92万/月，下半年持续超预算）" },
        },
        required: ["category", "direction", "description"],
      },
    },
    recommendations: {
      type: "array",
      description: "成本削减建议。按优先级排序，最重要的放第一位。每条必须具体可执行，禁止'加强管理'等空话。",
      items: {
        type: "object",
        properties: {
          priority:       { type: "string", enum: ["高", "中", "低"] },
          title:          { type: "string", description: "短标题" },
          action:         { type: "string", description: "具体动作步骤，含责任部门/时间窗/可量化目标" },
          expectedImpact: { type: "string", description: "预期影响，含金额或百分比" },
        },
        required: ["priority", "title", "action", "expectedImpact"],
      },
    },
  },
  required: ["summary", "anomalies", "trends", "recommendations"],
};

// 把统计数据序列化成 AI 易读的中文摘要 + 必要数据
export function buildAnalysisPrompt(stats: AnalysisStats): string {
  const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");
  const pct = (n: number) => (n * 100).toFixed(1) + "%";
  const lines: string[] = [];

  lines.push("你是一名经验丰富的财务分析师，正在为一家日本公司分析过去 12 个月的费用数据。");
  lines.push(`分析期间：${stats.period.from} ~ ${stats.period.to}`);
  lines.push("");

  lines.push("【公司费用分类（4 类，含口径定义）】");
  for (const c of stats.categories) {
    lines.push(`- ${c.name}：${c.description}`);
  }
  lines.push("");

  lines.push("【本期总览】");
  lines.push(`- 实际总支出：¥${fmt(stats.summary.totalActual)} / 预算：¥${fmt(stats.summary.totalBudget)} / 总消化率：${pct(stats.summary.totalActual / stats.summary.totalBudget)}`);
  lines.push(`- (类目×月) 超支单元数：${stats.summary.overBudgetCellsCount} / 总单元数：${stats.categories.length * (stats.categories[0]?.monthly.length ?? 0)}`);
  lines.push(`- (类目×月) 统计异常单元数（超"均值+2σ"）：${stats.summary.anomalyCellsCount}`);
  lines.push("");

  lines.push("【各类目逐月实际/预算（円）】");
  for (const c of stats.categories) {
    lines.push(`\n● ${c.name}  全年:¥${fmt(c.totalActual)} / 预算¥${fmt(c.totalBudget)} (消化${pct(c.consumptionRate)})  均值¥${fmt(c.monthlyMean)} σ¥${fmt(c.monthlyStdDev)} 异常阈值¥${fmt(c.anomalyThresholdHigh)}`);
    for (const m of c.monthly) {
      const flag = (m.isStatisticalAnomaly ? " ★统计异常" : "") + (m.overBudget > 0 ? " ⚠超" + fmt(m.overBudget) : "");
      lines.push(`  ${m.period.slice(0,7)}  实际¥${fmt(m.actual).padStart(13)} / 预算¥${fmt(m.budget).padStart(13)} (消化${pct(m.consumptionRate).padStart(6)})${flag}`);
    }
  }
  lines.push("");

  lines.push("【已圈出的统计异常单元 — 含 Top3 明细原始凭据】");
  let anomalyIdx = 0;
  for (const c of stats.categories) {
    for (const m of c.monthly) {
      if (!m.isStatisticalAnomaly) continue;
      anomalyIdx += 1;
      lines.push(`${anomalyIdx}. [${c.name} ${m.period.slice(0,7)}] 实际¥${fmt(m.actual)} 预算¥${fmt(m.budget)} 阈值¥${fmt(c.anomalyThresholdHigh)} 差额(实际-预算)¥${fmt(m.overBudget)}`);
      if (m.topLineItems) {
        for (const t of m.topLineItems) {
          lines.push(`   · ${t.expenseDate}  ${t.department}  ${t.vendor ?? "-"}  ¥${fmt(t.amount)}  -- ${t.description ?? ""}`);
        }
      }
    }
  }
  if (anomalyIdx === 0) lines.push("（无）");
  lines.push("");

  lines.push("【全局 Top 10 大额明细（参考用）】");
  for (const t of stats.topLineItems) {
    lines.push(`- ${t.expenseDate} [${t.categoryName}] ${t.department}  ${t.vendor ?? "-"}  ¥${fmt(t.amount)}  -- ${t.description ?? ""}`);
  }
  lines.push("");

  lines.push("【输出要求 — 严格遵守】");
  lines.push("1. 必须严格按 responseSchema 输出 JSON，不要任何 Markdown 包裹或额外文字。");
  lines.push("2. anomalies 至少要覆盖上面「已圈出的统计异常单元」中的每一条。区分两类：");
  lines.push("   - 计划内事件（如奖金月人件费、展会月活动费），若实际 ≤ 预算或与预算一致，isPlanned=true，reason 说明「季节性/事件性，预算已覆盖」；");
  lines.push("   - 真异常（无预算覆盖或显著超出），isPlanned=false。");
  lines.push("3. reason 与 evidence 必须引用上面表格中的具体数字、日期、供应商、摘要 — 严禁泛泛而谈。");
  lines.push("4. trends 要包含具体数字（如：广告基数从¥600,000/月升至¥920,000/月）。");
  lines.push("5. recommendations 必须具体可执行：含责任部门 / 时间窗 / 可量化目标 / 预期节省金额或百分比。优先级「高」放最前。禁止「加强成本控制」「提升管理水平」等空话。");
  lines.push("6. 全程中文输出。");

  return lines.join("\n");
}
