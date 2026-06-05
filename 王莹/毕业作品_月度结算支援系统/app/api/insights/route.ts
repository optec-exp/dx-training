import { NextRequest, NextResponse } from "next/server";
import { getCasesForMonth, getAvailableMonths } from "@/lib/data";
import { computeProfitReport } from "@/lib/profit";
import { getSgaForMonth } from "@/lib/sga";
import { getJpdeskHeads } from "@/lib/headcount";
import { getMarkupReport } from "@/lib/markup-review";
import { generateText } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

// 单月某口径的 毛利/贩管费/净利
async function monthFigures(month: string, 范围: "全社" | "中国" | "日本") {
  const cases = await getCasesForMonth(month);
  if (cases.length === 0) return null;
  const heads = await getJpdeskHeads(month);
  const r = computeProfitReport(cases, month, heads);
  const s = await getSgaForMonth(month);
  const 毛利 = 范围 === "全社" ? r.total : 范围 === "中国" ? r.china : r.japan;
  const 贩管费 = 范围 === "全社" ? s.total : 范围 === "中国" ? s.china : s.japan;
  return { 毛利, 贩管费, 净利: 毛利 - 贩管费, caseCount: r.caseCount };
}

export async function POST(req: NextRequest) {
  try {
    const { month, 范围 = "全社" } = (await req.json()) as { month: string; 范围?: "全社" | "中国" | "日本" };
    if (!/^\d{4}-\d{2}$/.test(month)) return NextResponse.json({ error: "month 格式 YYYY-MM" }, { status: 400 });

    const cur = await monthFigures(month, 范围);
    if (!cur) return NextResponse.json({ error: `${month} 无数据，请先同步` }, { status: 400 });

    // 累计 YTD：同年、≤ 当前月 的所有已同步月份
    const year = month.slice(0, 4);
    const months = (await getAvailableMonths()).filter((m) => m.startsWith(year) && m <= month).sort();
    const ytd = { 毛利: 0, 贩管费: 0, 净利: 0 };
    for (const m of months) { const f = await monthFigures(m, 范围); if (f) { ytd.毛利 += f.毛利; ytd.贩管费 += f.贩管费; ytd.净利 += f.净利; } }

    const markup = await getMarkupReport(month);
    const facts = [
      `口径：${范围}　利润月：${month}`,
      `当月：毛利 ${yen(cur.毛利)}，贩管费 ${yen(cur.贩管费)}，净利 ${yen(cur.净利)}（案件 ${cur.caseCount}）`,
      `累计(${year}年 ${months[0]}~${month})：毛利 ${yen(ytd.毛利)}，贩管费 ${yen(ytd.贩管费)}，净利 ${yen(ytd.净利)}`,
      范围 === "全社" ? `加成率审查：标准内 ${markup.counts.inScope} 票，超标 ${markup.counts.flagged} 票` : "",
    ].filter(Boolean).join("\n");

    const prompt = `你是一家国际货代公司的资深财务分析师。请根据以下【${范围}】${month} 经营数据，撰写一份简洁专业的【月度经营汇报】，先中文后日文(日文敬体)，每语言 150~250 字。
要点：当月经营结果概述、与累计(YTD)对比看趋势、指出亮点与风险、给 1~2 条管理建议。要有分析观点，不要罗列表格。

数据：
${facts}`;

    const text = await generateText(prompt);
    return NextResponse.json({ month, 范围, text, facts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
