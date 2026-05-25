import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// 类型定义
// ============================================================
type CaseInput = {
  id: number;
  case_number: string;
  customer_name: string;
  theme: string;
  status: string;
  mode: string;
  eta: string;
  awb_no: string;
  notes: string;
};

type AnalysisResult = {
  id: number;
  risk_level: "高" | "中" | "低";
  risk_score: number;
  delay_prediction: string;
  priority_rank: number;
  priority_action: string;
  bottleneck: string;
  reason: string;
};

// ============================================================
// Slack 通知（高风险案件）
// ============================================================
async function sendSlackAlert(c: CaseInput, a: AnalysisResult): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const res = await fetch(new URL("/api/slack", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "high_risk",
        record: c,
        analysis: a,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 预测提示词（Few-Shot）
// ============================================================
const SYSTEM_PROMPT = `你是国际物流公司的AI案件分析师，专门进行延迟风险预测和处理优先级建议。

【风险等级判定标准】
- 高风险：海关滞留 / ETA已过期 / 状态delayed / 备注含异常关键词（卡关/延误/投诉/赔偿）
- 中风险：ETA距今1~3天且状态不确定 / 状态pending超过正常时间
- 低风险：正常运输中且ETA未到 / 状态delivered / 无异常迹象

【输出格式】必须返回如下JSON（analyses数组长度与输入案件数量完全一致）：
{
  "analyses": [
    {
      "id": 案件的id数值,
      "risk_level": "高或中或低",
      "risk_score": 0到1之间的小数,
      "delay_prediction": "预计延迟情况说明（30字内）",
      "priority_rank": 从1开始的处理优先级排名,
      "priority_action": "建议的下一步操作（30字内）",
      "bottleneck": "当前瓶颈（20字内）",
      "reason": "判断理由（30字内）"
    }
  ]
}

【Few-Shot示例1】
输入：ID:1 | 案件番号:CASE-001 | 客户:ABC株式会社 | 状态:customs_hold | ETA:2025-05-08(已过4天) | 备注:海关要求补充原产地证明
输出：{"id":1,"risk_level":"高","risk_score":0.95,"delay_prediction":"预计延迟7天以上，文件补交后需重新审核","priority_rank":1,"priority_action":"立即联系进口商补交原产地证明","bottleneck":"海关滞留，文件缺失","reason":"货物海关滞留且ETA已过4天"}

【Few-Shot示例2】
输入：ID:2 | 案件番号:CASE-002 | 客户:XYZ公司 | 状态:in_transit | ETA:2025-05-16(还有2天) | 备注:无
输出：{"id":2,"risk_level":"中","risk_score":0.45,"delay_prediction":"按时到达概率70%，需确认末端配送","priority_rank":2,"priority_action":"联系目的地代理确认配送安排","bottleneck":"ETA临近，末端待确认","reason":"ETA距今仅2天，配送状态未确认"}

只返回JSON，不要返回任何多余的文字。`;

// ============================================================
// POST /api/analyze
// ============================================================
export async function POST(req: Request) {
  const { cases } = (await req.json()) as { cases: CaseInput[] };

  if (!cases || cases.length === 0) {
    return NextResponse.json({ error: "案件数据为空" }, { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 构造案件文本
  const casesText = cases
    .map((c) => {
      const eta = new Date(c.eta);
      eta.setHours(0, 0, 0, 0);
      const diffDays = Math.round((eta.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const etaLabel = diffDays >= 0 ? `还有${diffDays}天` : `已过${Math.abs(diffDays)}天`;
      return `ID:${c.id} | 案件番号:${c.case_number} | 客户:${c.customer_name} | 主题:${c.theme} | 状态:${c.status} | Mode:${c.mode} | ETA:${c.eta}(${etaLabel}) | AWB:${c.awb_no} | 备注:${c.notes || "无"}`;
    })
    .join("\n");

  try {
    // 调用 Groq API（使用 Llama 模型）
    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 4096,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `请分析以下${cases.length}个案件的风险和优先级：\n\n${casesText}`,
        },
      ],
    });

    const text = chatCompletion.choices[0]?.message?.content ?? "{}";
    // 提取 JSON（防止 AI 返回多余文字）
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : "{}") as { analyses: AnalysisResult[] };
    const analyses: AnalysisResult[] = parsed.analyses ?? [];

    // 将分析结果写入 ai_analyses 表
    for (const a of analyses) {
      await supabase.from("ai_analyses").upsert(
        {
          case_id:          a.id,
          risk_level:       a.risk_level,
          risk_score:       a.risk_score,
          delay_prediction: a.delay_prediction,
          priority_rank:    a.priority_rank,
          priority_action:  a.priority_action,
          bottleneck:       a.bottleneck,
          reason:           a.reason,
          analyzed_at:      new Date().toISOString(),
        },
        { onConflict: "case_id" }
      );
    }

    // Slack 通知已禁用
    const slackResults: Record<number, boolean> = {};

    // 写入分析日志
    const highCount = analyses.filter((a) => a.risk_level === "高").length;
    const midCount  = analyses.filter((a) => a.risk_level === "中").length;
    await supabase.from("sync_logs").insert({
      event_type: "AI_ANALYZE",
      summary: `AI分析完成: ${analyses.length}件, 高风险${highCount}件, 中风险${midCount}件`,
      detail: { total: analyses.length, high: highCount, mid: midCount, slack_sent: slackResults },
    });

    return NextResponse.json({
      analyses,
      slack_sent: slackResults,
      slack_configured: !!process.env.SLACK_WEBHOOK_URL,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "AI分析失败，请重试" },
      { status: 500 }
    );
  }
}
