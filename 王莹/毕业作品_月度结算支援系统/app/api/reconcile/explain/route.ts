import { NextRequest, NextResponse } from "next/server";
import { generateText } from "@/lib/gemini";
import { saveAiExplanation } from "@/lib/reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Row { opt_no: string; 币种: string; billAmount: number; kintoneAmount: number | null; diff: number | null; status: string; note?: string }

export async function POST(req: NextRequest) {
  try {
    const { rows, month } = (await req.json()) as { rows: Row[]; month?: string };
    if (!rows?.length) return NextResponse.json({ explanations: [] });
    const list = rows.slice(0, 30).map((r, i) => `${i + 1}. OPT ${r.opt_no} 状态=${r.status} 账单=${r.币种}${r.billAmount} Kintone=${r.kintoneAmount ?? "无"} 差额=${r.diff ?? "—"}${r.note ? " 备注=" + r.note : ""}`).join("\n");
    const prompt = `你是货代财务对账专家。下面是账单与Kintone成本比对出的差异项。为每条给出最可能的 1 个疑因（如：汇率换算差、费用科目错配、重复开票、Kintone漏录、分批收付款未匹配、金额录入错误、供应商未对应等）和 1 句处理建议。
只返回 JSON 数组：[{"opt_no":"...","疑因":"...","建议":"..."}]，不要多余文字。

差异项：
${list}`;
    const text = await generateText(prompt);
    let explanations: unknown = [];
    try { explanations = JSON.parse(text.replace(/```json|```/g, "").trim()); } catch { explanations = []; }
    // 回写到工作台对应差异行的备注（同步，不只是飘在顶部面板）
    if (Array.isArray(explanations) && month) {
      for (const e of explanations as { opt_no: string; 疑因: string; 建议: string }[]) {
        await saveAiExplanation(e.opt_no, month, e.疑因 || "", e.建议 || "");
      }
    }
    return NextResponse.json({ explanations });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
