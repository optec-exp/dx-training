import { NextRequest, NextResponse } from "next/server";
import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport, buildGroupPL } from "@/lib/profit";
import { getSgaForMonth, getSgaByDept } from "@/lib/sga";
import { getJpdeskHeads } from "@/lib/headcount";
import { getMarkupReport } from "@/lib/markup-review";
import { getBudgetsByObject } from "@/lib/budget";
import { getRiskPanel } from "@/lib/risk-panel";
import { getCashflowForecast, getInvestmentAdvice } from "@/lib/treasury";
import { generateJson } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const sign = (n: number) => (n >= 0 ? "+" : "") + Math.round(n).toLocaleString("ja-JP");
const pctDelta = (cur: number, base: number) => (base === 0 ? "—" : ((cur - base) / Math.abs(base) * 100).toFixed(1) + "%");
const pct = (a: number, b: number) => (b === 0 ? "—" : (a / b * 100).toFixed(0) + "%");

type Scope = "综合" | "全社" | "中国" | "日本";
type Period = "单月" | "财年累计";
interface PL { 毛利: number; 贩管费: number; 净利: number }
interface Mgmt { 部门: string; 贩管费: number; 地域: "中国" | "日本" }
interface MonthAll { 案件: number; 全社: PL; 中国: PL; 日本: PL; 业务部门: { 部门: string; 毛利: number; 贩管费: number; 净利: number }[]; 管理部门: Mgmt[] }

const fyOf = (month: string) => { const [y, m] = month.split("-").map(Number); return m >= 4 ? y : y - 1; };
const fyMonthsUpTo = (month: string, available: string[]) => { const fy = fyOf(month); return available.filter((m) => fyOf(m) === fy && m <= month).sort(); };
const prevMonth = (m: string) => { const [y, mo] = m.split("-").map(Number); return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, "0")}`; };
const mkPL = (毛利: number, 贩管费: number): PL => ({ 毛利, 贩管费, 净利: 毛利 - 贩管费 });
const emptyPL = (): PL => ({ 毛利: 0, 贩管费: 0, 净利: 0 });
const addPL = (a: PL, b: PL): PL => ({ 毛利: a.毛利 + b.毛利, 贩管费: a.贩管费 + b.贩管费, 净利: a.净利 + b.净利 });

async function monthAll(month: string): Promise<MonthAll | null> {
  const cases = await getCasesForMonth(month);
  if (cases.length === 0) return null;
  const heads = await getJpdeskHeads(month);
  const r = computeProfitReport(cases, month, heads);
  const s = await getSgaForMonth(month);
  const gpl = buildGroupPL(r.groups, await getSgaByDept(month));
  return {
    案件: r.caseCount, 全社: mkPL(r.total, s.total), 中国: mkPL(r.china, s.china), 日本: mkPL(r.japan, s.japan),
    业务部门: gpl.business.map((b) => ({ 部门: b.小组, 毛利: b.毛利, 贩管费: b.贩管费, 净利: b.净利 })),
    管理部门: gpl.mgmt,
  };
}

// 取某对象在某月的实际值（毛利/贩管费/净利；管理部门只有贩管费）
function actualOf(a: MonthAll, obj: string): { 毛利: number; 贩管费: number; 净利: number } | null {
  if (obj === "全社" || obj === "中国" || obj === "日本") return a[obj];
  const biz = a.业务部门.find((x) => x.部门 === obj);
  if (biz) return { 毛利: biz.毛利, 贩管费: biz.贩管费, 净利: biz.净利 };
  const mg = a.管理部门.find((x) => x.部门 === obj);
  if (mg) return { 毛利: 0, 贩管费: mg.贩管费, 净利: 0 };
  return null;
}

// 通用预实：按对象在「有预算的月份」上对齐累计 → 达成率
interface Ach { n: number; act毛利: number; act贩管费: number; act净利: number; bud毛利: number; bud贩管费: number; bud净利: number }
async function buildAchievements(months: string[], cache: Map<string, MonthAll>): Promise<Map<string, Ach>> {
  const acc = new Map<string, Ach>();
  for (const m of months) {
    const a = cache.get(m); if (!a) continue;
    const bo = await getBudgetsByObject([m]);
    for (const [obj, b] of Object.entries(bo)) {
      if (b.毛利 == null && b.贩管费 == null && b.净利 == null) continue;
      const act = actualOf(a, obj); if (!act) continue;
      const e = acc.get(obj) || { n: 0, act毛利: 0, act贩管费: 0, act净利: 0, bud毛利: 0, bud贩管费: 0, bud净利: 0 };
      e.n++; e.act毛利 += act.毛利; e.act贩管费 += act.贩管费; e.act净利 += act.净利;
      e.bud毛利 += b.毛利 || 0; e.bud贩管费 += b.贩管费 || 0; e.bud净利 += b.净利 || 0;
      acc.set(obj, e);
    }
  }
  return acc;
}
// 法人/业务部门：净利达成；管理部门：贩管费达成
const achNet = (acc: Map<string, Ach>, obj: string, total: number) => { const e = acc.get(obj); return e ? `净利达成 ${pct(e.act净利, e.bud净利)}${e.n < total ? `(预算覆盖${e.n}/${total}月)` : ""}` : "无预算"; };
const achSga = (acc: Map<string, Ach>, obj: string, total: number) => { const e = acc.get(obj); return e ? `贩管费达成 ${pct(e.act贩管费, e.bud贩管费)}${e.n < total ? `(覆盖${e.n}/${total}月)` : ""}` : "无预算"; };

const SCHEMA = {
  type: "object",
  properties: {
    summary_zh: { type: "string", description: "一句话摘要（中文，30字内）" },
    summary_ja: { type: "string", description: "一句话摘要（日文敬体，30字内）" },
    overview_zh: { type: "string", description: "经营概述（中文，100~150字，含总体+中日对比+趋势）" },
    overview_ja: { type: "string", description: "经营概述（日文敬体，100~150字）" },
    segments: { type: "array", description: "分部点评：综合模式下给 全社/中国/日本/各业务部门/各管理部门 每个一句点评；单法人模式留空数组", items: { type: "object", properties: { name: { type: "string" }, zh: { type: "string" }, ja: { type: "string" } }, required: ["name", "zh", "ja"] } },
    highlights: { type: "array", description: "亮点 1~3 条", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
    risks: { type: "array", description: "风险 1~3 条（结合负毛利/异常/挂账/达成率/亏损部门）", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
    suggestions: { type: "array", description: "管理建议 1~2 条", items: { type: "object", properties: { zh: { type: "string" }, ja: { type: "string" } }, required: ["zh", "ja"] } },
  },
  required: ["summary_zh", "summary_ja", "overview_zh", "overview_ja", "highlights", "risks", "suggestions"],
};

export async function GET() {
  return NextResponse.json({ months: await getAvailableMonths() });
}

export async function POST(req: NextRequest) {
  try {
    const { month, 范围 = "综合", 期间 = "单月" } = (await req.json()) as { month: string; 范围?: Scope; 期间?: Period };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });
    const available = await getAvailableMonths();
    const fyM = fyMonthsUpTo(month, available);
    const fy = fyOf(month);
    const isAll = 范围 === "综合";
    const months = 期间 === "财年累计" ? fyM : [month];

    // 加载并缓存各月全维度
    const cache = new Map<string, MonthAll>();
    for (const m of months) { const a = await monthAll(m); if (a) cache.set(m, a); }
    if (cache.size === 0) return NextResponse.json({ error: `${期间 === "财年累计" ? "FY" + fy : month} 无数据，请先同步` }, { status: 400 });

    // 聚合 cur
    const ordered = months.filter((m) => cache.has(m));
    const cur: MonthAll = { 案件: 0, 全社: emptyPL(), 中国: emptyPL(), 日本: emptyPL(), 业务部门: [], 管理部门: [] };
    const bizMap = new Map<string, PL>(); const mgMap = new Map<string, { 贩管费: number; 地域: "中国" | "日本" }>();
    const netTrend: { m: string; 全社: number }[] = [];
    for (const m of ordered) {
      const a = cache.get(m)!;
      cur.案件 += a.案件; cur.全社 = addPL(cur.全社, a.全社); cur.中国 = addPL(cur.中国, a.中国); cur.日本 = addPL(cur.日本, a.日本);
      for (const b of a.业务部门) bizMap.set(b.部门, addPL(bizMap.get(b.部门) || emptyPL(), mkPL(b.毛利, b.贩管费)));
      for (const g of a.管理部门) { const e = mgMap.get(g.部门) || { 贩管费: 0, 地域: g.地域 }; e.贩管费 += g.贩管费; mgMap.set(g.部门, e); }
      netTrend.push({ m, 全社: a.全社.净利 });
    }
    cur.业务部门 = [...bizMap].map(([部门, p]) => ({ 部门, ...p }));
    cur.管理部门 = [...mgMap].map(([部门, e]) => ({ 部门, 贩管费: e.贩管费, 地域: e.地域 }));

    const acc = await buildAchievements(ordered, cache);
    const tn = ordered.length;
    const periodLabel = 期间 === "财年累计" ? `FY${fy} 财年累计（${fyM[0]}~${month}，共 ${tn} 个月）` : `${month}（属 FY${fy}）`;

    const factLines: string[] = [`口径：${范围}　期间：${periodLabel}　案件 ${cur.案件}`];
    const scopes: Exclude<Scope, "综合">[] = isAll ? ["全社", "中国", "日本"] : [范围 as Exclude<Scope, "综合">];
    for (const sc of scopes) {
      const p = cur[sc];
      const shr = isAll && sc !== "全社" ? `（占全社净利 ${pct(p.净利, cur.全社.净利)}）` : "";
      factLines.push(`【${sc}】毛利 ${yen(p.毛利)}，贩管费 ${yen(p.贩管费)}，净利 ${yen(p.净利)}${shr}　${achNet(acc, sc, tn)}`);
    }

    // 环比（单月）/ 趋势（财年累计）
    if (期间 === "单月") {
      const prev = await monthAll(prevMonth(month));
      if (prev) for (const sc of scopes) { const c = cur[sc], pv = prev[sc]; factLines.push(`【${sc}·环比上月】毛利 ${sign(c.毛利 - pv.毛利)}(${pctDelta(c.毛利, pv.毛利)})，净利 ${sign(c.净利 - pv.净利)}(${pctDelta(c.净利, pv.净利)})`); }
      else factLines.push(`【环比上月】上月无数据`);
    } else {
      factLines.push(`【各月净利趋势】全社 ${netTrend.map((t) => `${t.m.slice(5)}月 ${yen(t.全社)}`).join(" → ")}`);
    }

    // 所有部门（综合时附：业务部门 P&L + 管理部门 贩管费），各带达成率
    if (isAll) {
      const biz = [...cur.业务部门].sort((a, b) => b.净利 - a.净利);
      factLines.push(`【业务部门 P&L】` + biz.map((g) => `${g.部门} 毛利${yen(g.毛利)}/净利${yen(g.净利)}（${achNet(acc, g.部门, tn)}）`).join("；"));
      const mg = [...cur.管理部门].sort((a, b) => b.贩管费 - a.贩管费);
      if (mg.length) factLines.push(`【管理部门 贩管费】` + mg.map((g) => `${g.部门}[${g.地域}] ${yen(g.贩管费)}（${achSga(acc, g.部门, tn)}）`).join("；"));
    }

    // 风控/资金（全社口径）
    if (isAll || 范围 === "全社") {
      if (期间 === "财年累计") {
        let neg = 0, big = 0, dup = 0, flagged = 0;
        for (const m of ordered) { const p = await getRiskPanel(m); neg += p.负毛利.length; big += p.异常大额.length; dup += p.重复成本.length; const mk = await getMarkupReport(m); if (mk.active) flagged += mk.counts.flagged; }
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
    const scopeDesc = isAll ? "综合（全社总体 + 中国/日本法人对比 + 所有部门：业务部门 + 管理部门）" : `【${范围}】`;
    const perMonthNote = 期间 === "财年累计" ? `本财年仅累计 ${tn} 个月（4月起），基于现有月份分析，勿臆测未同步月份。` : "";
    const prompt = `你是一家国际货代公司的资深财务分析师（CFO 视角）。根据以下 ${scopeDesc} ${periodLabel} 经营数据，撰写结构化【${reportKind}】，中日双语（日文敬体）。
${isAll ? "这是综合汇报：overview 覆盖全社总体、中日法人对比、整体趋势；segments 给【全社/中国/日本/每个业务部门/每个管理部门】各一句精炼点评（务必逐个覆盖，管理部门点评其贩管费控制）；亮点与风险指名到具体法人或部门。" : "segments 留空数组。"}
要求：有分析观点、点出因果与趋势，不要罗列数字表格；风险结合负毛利/异常/挂账/达成率/亏损部门具体指名；建议可执行。${perMonthNote}

经营数据：
${facts}`;

    const report = await generateJson(prompt, SCHEMA);
    return NextResponse.json({ month, 范围, 期间, report, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
