import { NextRequest, NextResponse } from "next/server";
import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport } from "@/lib/profit";
import { getSgaForMonth } from "@/lib/sga";
import { getJpdeskHeads } from "@/lib/headcount";
import { getMarkupReport } from "@/lib/markup-review";
import { getBudget } from "@/lib/budget";
import { getRiskPanel } from "@/lib/risk-panel";
import { getCashflowForecast, getInvestmentAdvice } from "@/lib/treasury";
import { generateJson } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const sign = (n: number) => (n >= 0 ? "+" : "") + Math.round(n).toLocaleString("ja-JP");
const pctDelta = (cur: number, base: number) => (base === 0 ? "—" : ((cur - base) / Math.abs(base) * 100).toFixed(1) + "%");
const ach = (act: number, bud: number | null) => (bud == null || bud === 0 ? "无预算" : (act / bud * 100).toFixed(0) + "%");

type Scope = "全社" | "中国" | "日本";

async function monthFigures(month: string, 范围: Scope) {
  const cases = await getCasesForMonth(month);
  if (cases.length === 0) return null;
  const heads = await getJpdeskHeads(month);
  const r = computeProfitReport(cases, month, heads);
  const s = await getSgaForMonth(month);
  const 毛利 = 范围 === "全社" ? r.total : 范围 === "中国" ? r.china : r.japan;
  const 贩管费 = 范围 === "全社" ? s.total : 范围 === "中国" ? s.china : s.japan;
  return { 毛利, 贩管费, 净利: 毛利 - 贩管费, caseCount: r.caseCount };
}

// 上一个自然月 YYYY-MM
function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const d = mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
  return d;
}

const SCHEMA = {
  type: "object",
  properties: {
    summary_zh: { type: "string", description: "一句话摘要（中文，30字内）" },
    summary_ja: { type: "string", description: "一句话摘要（日文敬体，30字内）" },
    overview_zh: { type: "string", description: "经营概述（中文，80~120字，含当月结果+环比+YTD趋势）" },
    overview_ja: { type: "string", description: "经营概述（日文敬体，80~120字）" },
    highlights: { type: "array", description: "亮点 1~3 条", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
    risks: { type: "array", description: "风险 1~3 条（结合负毛利/异常/挂账/达成率）", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
    suggestions: { type: "array", description: "管理建议 1~2 条", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
  },
  required: ["summary_zh", "summary_ja", "overview_zh", "overview_ja", "highlights", "risks", "suggestions"],
};

export async function GET() {
  const months = await getAvailableMonths();
  return NextResponse.json({ months });
}

export async function POST(req: NextRequest) {
  try {
    const { month, 范围 = "全社" } = (await req.json()) as { month: string; 范围?: Scope };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });

    const cur = await monthFigures(month, 范围);
    if (!cur) return NextResponse.json({ error: `${month} 无数据，请先同步` }, { status: 400 });

    // 环比上月
    const prev = await monthFigures(prevMonth(month), 范围);
    // 累计 YTD（同年、≤ 当月）
    const year = month.slice(0, 4);
    const months = (await getAvailableMonths()).filter((m) => m.startsWith(year) && m <= month).sort();
    const ytd = { 毛利: 0, 贩管费: 0, 净利: 0 };
    for (const m of months) { const f = await monthFigures(m, 范围); if (f) { ytd.毛利 += f.毛利; ytd.贩管费 += f.贩管费; ytd.净利 += f.净利; } }
    // 预实对比（当月预算）
    const bud = await getBudget(month, 范围);

    const factLines = [
      `口径：${范围}　利润月：${month}`,
      `【当月】毛利 ${yen(cur.毛利)}，贩管费 ${yen(cur.贩管费)}，净利 ${yen(cur.净利)}（案件 ${cur.caseCount}）`,
      prev ? `【环比上月】毛利 ${sign(cur.毛利 - prev.毛利)}(${pctDelta(cur.毛利, prev.毛利)})，净利 ${sign(cur.净利 - prev.净利)}(${pctDelta(cur.净利, prev.净利)})` : "【环比上月】上月无数据",
      `【当月预实】毛利达成 ${ach(cur.毛利, bud.毛利)}，净利达成 ${ach(cur.净利, bud.净利)}（预算 毛利 ${bud.毛利 == null ? "—" : yen(bud.毛利)}/净利 ${bud.净利 == null ? "—" : yen(bud.净利)}）`,
      `【累计 YTD ${months[0]}~${month}】毛利 ${yen(ytd.毛利)}，贩管费 ${yen(ytd.贩管费)}，净利 ${yen(ytd.净利)}`,
    ];

    // 全社才附风控/资金（这些指标不分中日法人）
    if (范围 === "全社") {
      const [markup, panel] = await Promise.all([getMarkupReport(month), getRiskPanel(month)]);
      const 挂账额 = panel.长期挂账.reduce((s, x) => s + x.金额, 0);
      const 坏账额 = panel.坏账.reduce((s, x) => s + x.金额, 0);
      factLines.push(`【风控·全社】负毛利 ${panel.负毛利.length} 票，异常大额 ${panel.异常大额.length} 票，重复成本 ${panel.重复成本.length} 笔，长期挂账 ${panel.长期挂账.length} 户/${yen(挂账额)}，坏账 ${yen(坏账额)}`);
      if (markup.active) factLines.push(`【加成率审查】标准内 ${markup.counts.inScope} 票，超标 ${markup.counts.flagged} 票`);
      try {
        const [cf, inv] = await Promise.all([getCashflowForecast(), getInvestmentAdvice()]);
        const net = cf.reduce((s, r) => s + r.净流入, 0);
        factLines.push(`【资金·全社】现金流预测净额 ${sign(net)}；HSBC可投美金 $${Math.round(inv.可投USD).toLocaleString()}（${inv.状态}）`);
      } catch { /* 资金数据可选 */ }
    }

    const facts = factLines.filter(Boolean).join("\n");
    const prompt = `你是一家国际货代公司的资深财务分析师（CFO 视角）。根据以下【${范围}】${month} 经营数据，撰写一份结构化【月度经营汇报】，中日双语（日文用敬体）。
要求：有分析观点、点出因果与趋势，不要罗列数字表格；风险要结合负毛利/异常/挂账/达成率具体指名；建议要可执行。各字段简洁专业。

经营数据：
${facts}`;

    const report = await generateJson(prompt, SCHEMA);
    return NextResponse.json({ month, 范围, report, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
