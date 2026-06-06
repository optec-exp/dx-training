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
type Period = "单月" | "财年累计";

// 财年：4月起。某月所属财年起始年。
const fyOf = (month: string) => { const [y, m] = month.split("-").map(Number); return m >= 4 ? y : y - 1; };
const fyMonthsUpTo = (month: string, available: string[]) => { const fy = fyOf(month); return available.filter((m) => fyOf(m) === fy && m <= month).sort(); };

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

function prevMonth(m: string) {
  const [y, mo] = m.split("-").map(Number);
  return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`;
}

const SCHEMA = {
  type: "object",
  properties: {
    summary_zh: { type: "string", description: "一句话摘要（中文，30字内）" },
    summary_ja: { type: "string", description: "一句话摘要（日文敬体，30字内）" },
    overview_zh: { type: "string", description: "经营概述（中文，80~120字，含结果+趋势）" },
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
    const { month, 范围 = "全社", 期间 = "单月" } = (await req.json()) as { month: string; 范围?: Scope; 期间?: Period };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });
    const available = await getAvailableMonths();
    const fyM = fyMonthsUpTo(month, available);
    const fy = fyOf(month);

    let facts: string, header: string;

    if (期间 === "财年累计") {
      // 各月聚合
      const perMonth: { m: string; 净利: number }[] = [];
      const sum = { 毛利: 0, 贩管费: 0, 净利: 0, 案件: 0 };
      // 达成率只在"有预算的月份"上对齐：分子用同月实际，分母用同月预算
      const budSum = { 毛利预算: 0, 净利预算: 0, 毛利实际: 0, 净利实际: 0, months: 0 };
      for (const m of fyM) {
        const f = await monthFigures(m, 范围); if (!f) continue;
        sum.毛利 += f.毛利; sum.贩管费 += f.贩管费; sum.净利 += f.净利; sum.案件 += f.caseCount;
        perMonth.push({ m, 净利: f.净利 });
        const b = await getBudget(m, 范围);
        if (b.毛利 != null || b.净利 != null) { budSum.months++; budSum.毛利预算 += b.毛利 || 0; budSum.净利预算 += b.净利 || 0; budSum.毛利实际 += f.毛利; budSum.净利实际 += f.净利; }
      }
      if (perMonth.length === 0) return NextResponse.json({ error: `FY${fy} 无数据，请先同步` }, { status: 400 });
      const 月均净利 = sum.净利 / perMonth.length;
      const 预实行 = budSum.months === 0
        ? `【累计预实】无预算`
        : `【累计预实·预算覆盖 ${budSum.months}/${perMonth.length} 月】毛利达成 ${ach(budSum.毛利实际, budSum.毛利预算)}，净利达成 ${ach(budSum.净利实际, budSum.净利预算)}（同口径累计：实际 净利 ${yen(budSum.净利实际)} vs 预算 ${yen(budSum.净利预算)}）`;
      const factLines = [
        `口径：${范围}　期间：FY${fy} 财年累计（${fyM[0]}~${month}，共 ${perMonth.length} 个月）`,
        `【财年累计】毛利 ${yen(sum.毛利)}，贩管费 ${yen(sum.贩管费)}，净利 ${yen(sum.净利)}（案件 ${sum.案件}，月均净利 ${yen(月均净利)}）`,
        `【各月净利趋势】${perMonth.map((p) => `${p.m.slice(5)}月 ${yen(p.净利)}`).join(" → ")}`,
        预实行,
      ];
      if (范围 === "全社") {
        // 风控按月汇总（异常计数累加；挂账/坏账取最新时点）
        let neg = 0, big = 0, dup = 0, flagged = 0;
        for (const m of fyM) {
          const p = await getRiskPanel(m); neg += p.负毛利.length; big += p.异常大额.length; dup += p.重复成本.length;
          const mk = await getMarkupReport(m); if (mk.active) flagged += mk.counts.flagged;
        }
        const latest = await getRiskPanel(month);
        const 挂账额 = latest.长期挂账.reduce((s, x) => s + x.金额, 0);
        const 坏账额 = latest.坏账.reduce((s, x) => s + x.金额, 0);
        factLines.push(`【风控·全社·财年累计】负毛利 ${neg} 票，异常大额 ${big} 票，重复成本 ${dup} 笔，加成率超标 ${flagged} 票；当前长期挂账 ${latest.长期挂账.length} 户/${yen(挂账额)}，坏账 ${yen(坏账额)}`);
        try {
          const [cf, inv] = await Promise.all([getCashflowForecast(), getInvestmentAdvice()]);
          const net = cf.reduce((s, r) => s + r.净流入, 0);
          factLines.push(`【资金·全社·当前时点】现金流预测净额 ${sign(net)}；HSBC可投美金 $${Math.round(inv.可投USD).toLocaleString()}（${inv.状态}）`);
        } catch { /* 资金可选 */ }
      }
      facts = factLines.filter(Boolean).join("\n");
      header = `你是一家国际货代公司的资深财务分析师（CFO 视角）。根据以下【${范围}】FY${fy} 财年累计经营数据，撰写结构化【财年累计经营汇报】，中日双语（日文敬体）。
注意：本财年仅累计了 ${perMonth.length} 个月（4月起），请基于现有月份分析累计表现与各月走势，可指出"样本仅 ${perMonth.length} 个月"的局限，不要臆测未同步月份。`;
    } else {
      // 单月
      const cur = await monthFigures(month, 范围);
      if (!cur) return NextResponse.json({ error: `${month} 无数据，请先同步` }, { status: 400 });
      const prev = await monthFigures(prevMonth(month), 范围);
      // 财年累计 YTD（修正：财年口径，非自然年）
      const ytd = { 毛利: 0, 贩管费: 0, 净利: 0 };
      for (const m of fyM) { const f = await monthFigures(m, 范围); if (f) { ytd.毛利 += f.毛利; ytd.贩管费 += f.贩管费; ytd.净利 += f.净利; } }
      const bud = await getBudget(month, 范围);
      const factLines = [
        `口径：${范围}　利润月：${month}（属 FY${fy}）`,
        `【当月】毛利 ${yen(cur.毛利)}，贩管费 ${yen(cur.贩管费)}，净利 ${yen(cur.净利)}（案件 ${cur.caseCount}）`,
        prev ? `【环比上月】毛利 ${sign(cur.毛利 - prev.毛利)}(${pctDelta(cur.毛利, prev.毛利)})，净利 ${sign(cur.净利 - prev.净利)}(${pctDelta(cur.净利, prev.净利)})` : "【环比上月】上月无数据",
        `【当月预实】毛利达成 ${ach(cur.毛利, bud.毛利)}，净利达成 ${ach(cur.净利, bud.净利)}（预算 毛利 ${bud.毛利 == null ? "—" : yen(bud.毛利)}/净利 ${bud.净利 == null ? "—" : yen(bud.净利)}）`,
        `【财年累计 FY${fy} ${fyM[0]}~${month}】毛利 ${yen(ytd.毛利)}，贩管费 ${yen(ytd.贩管费)}，净利 ${yen(ytd.净利)}`,
      ];
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
        } catch { /* 资金可选 */ }
      }
      facts = factLines.filter(Boolean).join("\n");
      header = `你是一家国际货代公司的资深财务分析师（CFO 视角）。根据以下【${范围}】${month} 经营数据，撰写结构化【月度经营汇报】，中日双语（日文敬体）。`;
    }

    const prompt = `${header}
要求：有分析观点、点出因果与趋势，不要罗列数字表格；风险要结合负毛利/异常/挂账/达成率具体指名；建议要可执行。各字段简洁专业。

经营数据：
${facts}`;

    const report = await generateJson(prompt, SCHEMA);
    return NextResponse.json({ month, 范围, 期间, report, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
