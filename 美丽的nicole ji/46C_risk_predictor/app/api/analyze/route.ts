import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================
// 类型定义
// ============================================================
type Case = {
  id: number;
  case_number: string;
  customer_name: string;
  awb_number: string;
  origin: string;
  destination: string;
  cargo_type: string;
  weight_kg: number;
  status: string;
  eta: string;
  notes: string;
};

type Analysis = {
  id: number;
  risk_level: "高" | "中" | "低";
  risk_score: number;
  bottleneck: string;
  priority_action: string;
  reason: string;
};

// ============================================================
// Slack 通知（高风险案件）
// ============================================================
async function sendSlackAlert(c: Case, a: Analysis): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  const payload = {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "🚨 高风险案件警报" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*案件番号*\n${c.case_number}` },
          { type: "mrkdwn", text: `*客户*\n${c.customer_name}` },
          { type: "mrkdwn", text: `*AWB*\n${c.awb_number}` },
          {
            type: "mrkdwn",
            text: `*路线*\n${c.origin} → ${c.destination}`,
          },
          { type: "mrkdwn", text: `*状态*\n${c.status}` },
          { type: "mrkdwn", text: `*ETA*\n${c.eta}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🔍 AI分析结果*\n*瓶颈：* ${a.bottleneck}\n*优先处理：* ${a.priority_action}\n*理由：* ${a.reason}`,
        },
      },
      { type: "divider" },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// 预测任务提示词（Few-Shot 示例 + 风险判定标准）
// ============================================================
const SYSTEM_PROMPT = `你是国际物流公司的AI风险分析师，专门预测案件延迟风险。

【风险等级判定标准】
- 高风险：海关滞留（customs_hold）/ ETA已过期 / 状态为delayed / 备注含异常关键词（卡关/延误/投诉/赔偿）
- 中风险：ETA距今1~3天且状态不确定 / 状态为pending超过正常时间 / 需要关注
- 低风险：正常运输中且ETA未到 / 状态delivered / 无异常迹象

【输出格式】必须返回如下JSON（analyses数组长度与输入案件数量完全一致）：
{
  "analyses": [
    {
      "id": 案件的id数值,
      "risk_level": "高或中或低",
      "risk_score": 0到1之间的小数（高风险接近1.0，低风险接近0.0）,
      "bottleneck": "当前最主要的瓶颈（20字以内）",
      "priority_action": "立即需要做什么（30字以内，具体可操作）",
      "reason": "风险判断理由（30字以内）"
    }
  ]
}

【Few-Shot示例1】
输入：ID:1 | 案件番号:CASE-001 | 客户:ABC株式会社 | AWB:724-12345678 | 路线:东京→上海 | 货物:电子元件 | 状态:customs_hold | ETA:2025-05-08(已过4天) | 备注:海关要求补充原产地证明，未收到回复
输出：{"id":1,"risk_level":"高","risk_score":0.95,"bottleneck":"海关滞留，原产地证明待补交","priority_action":"立即联系进口商补交原产地证明，同日跟进海关状态","reason":"货物海关滞留且ETA已过4天，文件缺失未解决"}

【Few-Shot示例2】
输入：ID:2 | 案件番号:CASE-002 | 客户:XYZ公司 | AWB:180-87654321 | 路线:大阪→香港 | 货物:服装 | 状态:in_transit | ETA:2025-05-16(还有2天) | 备注:无
输出：{"id":2,"risk_level":"中","risk_score":0.45,"bottleneck":"ETA临近，需确认末端配送状态","priority_action":"联系目的地代理确认最终配送安排","reason":"ETA距今仅2天，尚未确认末端配送状态"}`;

// ============================================================

export async function POST(req: NextRequest) {
  const { cases } = (await req.json()) as { cases: Case[] };

  if (!cases || cases.length === 0) {
    return new Response("案件数据为空", { status: 400 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 把案件列表拼成文字发给AI
  const casesText = cases
    .map((c) => {
      const eta = new Date(c.eta);
      eta.setHours(0, 0, 0, 0);
      const diffDays = Math.round(
        (eta.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const etaLabel =
        diffDays >= 0 ? `还有${diffDays}天` : `已过${Math.abs(diffDays)}天`;
      return `ID:${c.id} | 案件番号:${c.case_number} | 客户:${c.customer_name} | AWB:${c.awb_number} | 路线:${c.origin}→${c.destination} | 货物:${c.cargo_type} ${c.weight_kg}kg | 状态:${c.status} | ETA:${c.eta}(${etaLabel}) | 备注:${c.notes || "无"}`;
    })
    .join("\n");

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" }, // 强制JSON输出
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `请分析以下${cases.length}个案件的风险：\n\n${casesText}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { analyses: Analysis[] };
    const analyses: Analysis[] = parsed.analyses ?? [];

    // 高风险案件自动发送 Slack 通知
    const slackResults: Record<number, boolean> = {};
    for (const a of analyses) {
      if (a.risk_level === "高") {
        const targetCase = cases.find((c) => c.id === a.id);
        if (targetCase) {
          slackResults[a.id] = await sendSlackAlert(targetCase, a);
        }
      }
    }

    return Response.json({
      analyses,
      slack_sent: slackResults,
      slack_configured: !!process.env.SLACK_WEBHOOK_URL,
    });
  } catch (err) {
    console.error(err);
    return new Response("AI分析失败，请重试", { status: 500 });
  }
}
