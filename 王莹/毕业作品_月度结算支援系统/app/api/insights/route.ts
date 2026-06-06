import { NextRequest, NextResponse } from "next/server";
import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport, buildGroupPL } from "@/lib/profit";
import { getSgaForMonth, getSgaByDept } from "@/lib/sga";
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
const share = (part: number, whole: number) => (whole === 0 ? "—" : (part / whole * 100).toFixed(0) + "%");

type Scope = "综合" | "全社" | "中国" | "日本";
type Period = "单月" | "财年累计";
interface PL { 毛利: number; 贩管费: number; 净利: number }
interface MonthAll { 案件: number; 全社: PL; 中国: PL; 日本: PL; 小组: { 小组: string; 毛利: number; 贩管费: number; 净利: number }[] }

const fyOf = (month: string) => { const [y, m] = month.split("-").map(Number); return m >= 4 ? y : y - 1; };
const fyMonthsUpTo = (month: string, available: string[]) => { const fy = fyOf(month); return available.filter((m) => fyOf(m) === fy && m <= month).sort(); };
const prevMonth = (m: string) => { const [y, mo] = m.split("-").map(Number); return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`; };
const pl = (毛利: number, 贩管费: number): PL => ({ 毛利, 贩管费, 净利: 毛利 - 贩管费 });

// 单月全维度：全社/中国/日本 + 各业务小组
async function monthAll(month: string): Promise<MonthAll | null> {
  const cases = await getCasesForMonth(month);
  if (cases.length === 0) return null;
  const heads = await getJpdeskHeads(month);
  const r = computeProfitReport(cases, month, heads);
  const s = await getSgaForMonth(month);
  const gpl = buildGroupPL(r.groups, await getSgaByDept(month));
  return { 案件: r.caseCount, 全社: pl(r.total, s.total), 中国: pl(r.china, s.china), 日本: pl(r.japan, s.japan), 小组: gpl.business };
}

const emptyPL = (): PL => ({ 毛利: 0, 贩管费: 0, 净利: 0 });
const addPL = (a: PL, b: PL): PL => ({ 毛利: a.毛利 + b.毛利, 贩管费: a.贩管费 + b.贩管费, 净利: a.净利 + b.净利 });

const SCHEMA = {
  type: "object",
  properties: {
    summary_zh: { type: "string", description: "一句话摘要（中文，30字内）" },
    summary_ja: { type: "string", description: "一句话摘要（日文敬体，30字内）" },
    overview_zh: { type: "string", description: "经营概述（中文，100~150字，含总体+中日对比+趋势）" },
    overview_ja: { type: "string", description: "经营概述（日文敬体，100~150字）" },
    segments: { type: "array", description: "分部点评：综合模式下给 全社/中国/日本/各业务小组 每个一句点评；单法人模式留空数组", items: { type: "object", properties: { name: { type: "string" }, zh: { type: "string" }, ja: { type: "string" } }, required: ["name", "zh", "ja"] } },
    highlights: { type: "array", description: "亮点 1~3 条", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
    risks: { type: "array", description: "风险 1~3 条（结合负毛利/异常/挂账/达成率/亏损小组）", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
    suggestions: { type: "array", description: "管理建议 1~2 条", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
  },
  required: ["summary_zh", "summary_ja", "overview_zh", "overview_ja", "highlights", "risks", "suggestions"],
};

export async function GET() {
  return NextResponse.json({ months: await getAvailableMonths() });
}

// 某法人某期间数据行（综合时复用）
function scopeLines(范围: Exclude<Scope, "综合">, get: (k: Exclude<Scope, "综合">) => PL): string {
  const p = get(范围);
  return `毛利 ${yen(p.毛利)}，贩管费 ${yen(p.贩管费)}，净利 ${yen(p.净利)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { month, 范围 = "综合", 期间 = "单月" } = (await req.json()) as { month: string; 范围?: Scope; 期间?: Period };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });
    const available = await getAvailableMonths();
    const fyM = fyMonthsUpTo(month, available);
    const fy = fyOf(month);
    const isAll = 范围 === "综合";
    const factLines: string[] = [];
    let periodLabel: string, perMonthNote = "";

    // 聚合数据（单月或财年累计）
    let cur: MonthAll;
    let netTrend: { m: string; 全社: number; 中国: number; 日本: number }[] = [];
    let budgetMonths: string[] = [];
    if (期间 === "财年累计") {
      const agg: MonthAll = { 案件: 0, 全社: emptyPL(), 中国: emptyPL(), 日本: emptyPL(), 小组: [] };
      const grpMap = new Map<string, PL>();
      for (const m of fyM) {
        const a = await monthAll(m); if (!a) continue;
        agg.案件 += a.案件; agg.全社 = addPL(agg.全社, a.全社); agg.中国 = addPL(agg.中国, a.中国); agg.日本 = addPL(agg.日本, a.日本);
        for (const g of a.小组) grpMap.set(g.小组, addPL(grpMap.get(g.小组) || emptyPL(), pl(g.毛利, g.贩管费)));
        netTrend.push({ m, 全社: a.全社.净利, 中国: a.中国.净利, 日本: a.日本.净利 });
        const b = await getBudget(m, "全社"); if (b.毛利 != null || b.净利 != null) budgetMonths.push(m);
      }
      if (netTrend.length === 0) return NextResponse.json({ error: `FY${fy} 无数据，请先同步` }, { status: 400 });
      agg.小组 = [...grpMap].map(([小组, p]) => ({ 小组, ...p }));
      cur = agg;
      periodLabel = `FY${fy} 财年累计（${fyM[0]}~${month}，共 ${netTrend.length} 个月）`;
      perMonthNote = `本财年仅累计 ${netTrend.length} 个月（4月起），基于现有月份分析，勿臆测未同步月份。`;
    } else {
      const a = await monthAll(month);
      if (!a) return NextResponse.json({ error: `${month} 无数据，请先同步` }, { status: 400 });
      cur = a;
      periodLabel = `${month}（属 FY${fy}）`;
      const b = await getBudget(month, "全社"); if (b.毛利 != null || b.净利 != null) budgetMonths = [month];
    }

    factLines.push(`口径：${范围}　期间：${periodLabel}　案件 ${cur.案件}`);

    // 法人层
    const scopes: Exclude<Scope, "综合">[] = isAll ? ["全社", "中国", "日本"] : [范围 as Exclude<Scope, "综合">];
    const getPL = (k: Exclude<Scope, "综合">) => cur[k];
    for (const sc of scopes) {
      const p = getPL(sc);
      const shareNote = isAll && sc !== "全社" ? `（占全社净利 ${share(p.净利, cur.全社.净利)}）` : "";
      factLines.push(`【${sc}】${scopeLines(sc, getPL)}${shareNote}`);
    }

    // 环比（单月）或 趋势（财年累计）
    if (期间 === "单月") {
      const prev = await monthAll(prevMonth(month));
      if (prev) for (const sc of scopes) {
        const c = cur[sc], pv = prev[sc];
        factLines.push(`【${sc}·环比上月】毛利 ${sign(c.毛利 - pv.毛利)}(${pctDelta(c.毛利, pv.毛利)})，净利 ${sign(c.净利 - pv.净利)}(${pctDelta(c.净利, pv.净利)})`);
      } else factLines.push(`【环比上月】上月无数据`);
    } else {
      factLines.push(`【各月净利趋势】全社 ${netTrend.map((t) => `${t.m.slice(5)}月 ${yen(t.全社)}`).join(" → ")}`);
    }

    // 预实（仅全社有预算）
    if (期间 === "财年累计") {
      let budN = 0, actNet = 0, budNet = 0, actGp = 0, budGp = 0;
      for (const m of budgetMonths) { const b = await getBudget(m, "全社"); const a = await monthAll(m); if (a) { budN++; actNet += a.全社.净利; budNet += b.净利 || 0; actGp += a.全社.毛利; budGp += b.毛利 || 0; } }
      factLines.push(budN ? `【全社累计预实·预算覆盖 ${budN}/${netTrend.length} 月】毛利达成 ${ach(actGp, budGp)}，净利达成 ${ach(actNet, budNet)}（同口径累计 净利 实际 ${yen(actNet)} vs 预算 ${yen(budNet)}）` : `【预实】本财年累计无预算`);
    } else {
      const b = await getBudget(month, "全社");
      factLines.push(`【全社当月预实】毛利达成 ${ach(cur.全社.毛利, b.毛利)}，净利达成 ${ach(cur.全社.净利, b.净利)}（预算 毛利 ${b.毛利 == null ? "—" : yen(b.毛利)}/净利 ${b.净利 == null ? "—" : yen(b.净利)}）`);
    }

    // 业务小组（综合时附）
    if (isAll) {
      const gsorted = [...cur.小组].sort((a, b) => b.净利 - a.净利);
      factLines.push(`【业务小组 P&L】` + gsorted.map((g) => `${g.小组} 毛利${yen(g.毛利)}/净利${yen(g.净利)}`).join("；"));
    }

    // 风控/资金（全社口径，综合与全社时附）
    if (isAll || 范围 === "全社") {
      if (期间 === "财年累计") {
        let neg = 0, big = 0, dup = 0, flagged = 0;
        for (const m of fyM) { const p = await getRiskPanel(m); neg += p.负毛利.length; big += p.异常大额.length; dup += p.重复成本.length; const mk = await getMarkupReport(m); if (mk.active) flagged += mk.counts.flagged; }
        const latest = await getRiskPanel(month);
        factLines.push(`【风控·全社·财年累计】负毛利 ${neg} 票，异常大额 ${big} 票，重复成本 ${dup} 笔，加成率超标 ${flagged} 票；当前长期挂账 ${latest.长期挂账.length} 户/${yen(latest.长期挂账.reduce((s, x) => s + x.金额, 0))}，坏账 ${yen(latest.坏账.reduce((s, x) => s + x.金额, 0))}`);
      } else {
        const [markup, panel] = await Promise.all([getMarkupReport(month), getRiskPanel(month)]);
        factLines.push(`【风控·全社】负毛利 ${panel.负毛利.length} 票，异常大额 ${panel.异常大额.length} 票，重复成本 ${panel.重复成本.length} 笔，长期挂账 ${panel.长期挂账.length} 户/${yen(panel.长期挂账.reduce((s, x) => s + x.金额, 0))}，坏账 ${yen(panel.坏账.reduce((s, x) => s + x.金额, 0))}`);
        if (markup.active) factLines.push(`【加成率审查】标准内 ${markup.counts.inScope} 票，超标 ${markup.counts.flagged} 票`);
      }
      try {
        const [cf, inv] = await Promise.all([getCashflowForecast(), getInvestmentAdvice()]);
        factLines.push(`【资金·全社·当前时点】现金流预测净额 ${sign(cf.reduce((s, r) => s + r.净流入, 0))}；HSBC可投美金 $${Math.round(inv.可投USD).toLocaleString()}（${inv.状态}）`);
      } catch { /* 资金可选 */ }
    }

    const facts = factLines.join("\n");
    const reportKind = 期间 === "财年累计" ? "财年累计经营汇报" : "月度经营汇报";
    const scopeDesc = isAll ? "综合（全社总体 + 中国/日本法人对比 + 各业务小组）" : `【${范围}】`;
    const prompt = `你是一家国际货代公司的资深财务分析师（CFO 视角）。根据以下 ${scopeDesc} ${periodLabel} 经营数据，撰写结构化【${reportKind}】，中日双语（日文敬体）。
${isAll ? "这是一份综合汇报：overview 要覆盖全社总体表现、中日法人对比、整体趋势；segments 给【全社/中国/日本/每个业务小组】各一句精炼点评（务必逐个覆盖）；亮点与风险要指名到具体法人或小组。" : "segments 留空数组。"}
要求：有分析观点、点出因果与趋势，不要罗列数字表格；风险结合负毛利/异常/挂账/达成率/亏损小组具体指名；建议可执行。${perMonthNote}

经营数据：
${facts}`;

    const report = await generateJson(prompt, SCHEMA);
    return NextResponse.json({ month, 范围, 期间, report, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
