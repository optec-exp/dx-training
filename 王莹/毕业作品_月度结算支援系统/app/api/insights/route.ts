import { NextRequest, NextResponse } from "next/server";
import { getCasesForMonth } from "@/lib/data";
import { computeProfitReport } from "@/lib/profit";
import { getSgaForMonth } from "@/lib/sga";
import { getMarkupReport } from "@/lib/markup-review";
import { generateText } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export async function POST(req: NextRequest) {
  try {
    const { month } = (await req.json()) as { month: string };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });

    const cases = await getCasesForMonth(month);
    if (cases.length === 0) return NextResponse.json({ error: `${month} 无案件数据，请先同步` }, { status: 400 });
    const profit = computeProfitReport(cases, month);
    const sga = await getSgaForMonth(month);
    const markup = await getMarkupReport(month);

    const topGroups = profit.groups.filter((g) => !g.indent).sort((a, b) => b.total - a.total).slice(0, 4)
      .map((g) => `${g.name} ${yen(g.total)}`).join("、");

    const facts = [
      `利润月：${month}，案件数 ${profit.caseCount}`,
      `全社：毛利 ${yen(profit.total)}，贩管费 ${yen(sga.total)}，净利 ${yen(profit.total - sga.total)}`,
      `中国：毛利 ${yen(profit.china)}，贩管费 ${yen(sga.china)}，净利 ${yen(profit.china - sga.china)}`,
      `日本：毛利 ${yen(profit.japan)}，贩管费 ${yen(sga.japan)}，净利 ${yen(profit.japan - sga.japan)}`,
      `小组利润 Top：${topGroups}`,
      `贩管费 5 类：${Object.entries(sga.byCategory).map(([k, v]) => `${k} ${yen(v)}`).join("、")}`,
      `加成率审查：标准内 ${markup.counts.inScope} 票，超标 ${markup.counts.flagged} 票；各大类月均加成率 ${markup.avgByScope.map((s) => `${s.scope} ${(s.avg * 100).toFixed(0)}%`).join("、") || "无"}`,
    ].join("\n");

    const prompt = `你是一家国际货代公司的资深财务分析师。请根据以下 ${month} 月度经营数据，撰写一份简洁专业的【月度经营点评】，先中文后日文（日文用敬体），每种语言 150~250 字。
要点：概述经营结果(净利/中日对比)、指出亮点与风险(如加成率超标、贩管费占比)、给出 1~2 条管理建议。不要罗列原始数字表格，要有分析观点。

经营数据：
${facts}`;

    const text = await generateText(prompt);
    return NextResponse.json({ month, text, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
