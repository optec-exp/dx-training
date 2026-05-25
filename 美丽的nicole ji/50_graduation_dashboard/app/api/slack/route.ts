import { NextResponse } from "next/server";

// Slack Block Kit 通知
export async function POST(req: Request) {
  const { record, analysis, type } = await req.json() as {
    record?: { case_number?: string; customer_name?: string; status?: string; mode?: string; eta?: string; awb_no?: string };
    analysis?: { risk_level?: string; bottleneck?: string; priority_action?: string; reason?: string };
    type: "sync_new" | "high_risk" | "status_change";
  };

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ ok: false, error: "SLACK_WEBHOOK_URL not set" });
  }

  const r = record ?? {};

  // 根据通知类型构造不同的消息
  let blocks;
  if (type === "high_risk" && analysis) {
    blocks = [
      { type: "header", text: { type: "plain_text", text: "\u{1f6a8} 高风险案件警报" } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*案件番号*\n${r.case_number || "—"}` },
          { type: "mrkdwn", text: `*客户*\n${r.customer_name || "—"}` },
          { type: "mrkdwn", text: `*AWB*\n${r.awb_no || "—"}` },
          { type: "mrkdwn", text: `*状态*\n${r.status || "—"}` },
          { type: "mrkdwn", text: `*ETA*\n${r.eta || "—"}` },
          { type: "mrkdwn", text: `*Mode*\n${r.mode || "—"}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*AI分析结果*\n*瓶颈：* ${analysis.bottleneck}\n*优先处理：* ${analysis.priority_action}\n*理由：* ${analysis.reason}`,
        },
      },
      { type: "divider" },
    ];
  } else {
    // 新记录同步 / 状态变更
    const title = type === "sync_new" ? "\u{1f4e6} 新案件同步" : "\u{1f504} 案件状态变更";
    blocks = [
      { type: "header", text: { type: "plain_text", text: title } },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*案件番号*\n${r.case_number || "—"}` },
          { type: "mrkdwn", text: `*客户*\n${r.customer_name || "—"}` },
          { type: "mrkdwn", text: `*状态*\n${r.status || "—"}` },
          { type: "mrkdwn", text: `*ETA*\n${r.eta || "—"}` },
        ],
      },
      { type: "divider" },
    ];
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
