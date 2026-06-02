import type { AnalysisReportRow } from "@/lib/google-docs";

// Slack Block Kit message blocks 的最小类型（够用就行，不引 SDK）
type SlackBlock = Record<string, unknown>;

export async function notifyReportToSlack(report: AnalysisReportRow): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) throw new Error("缺少 SLACK_WEBHOOK_URL");

  const realAnomalies = report.anomalies.filter((a) => !a.isPlanned).length;
  const wan = (n: number) => (Number(n) / 10000).toLocaleString("ja-JP", { maximumFractionDigits: 0 });
  const pct = (n: number) => (Number(n) * 100).toFixed(1) + "%";
  const periodLabel = `${report.period_start.slice(0, 7)} ~ ${report.period_end.slice(0, 7)}`;
  const totalRate = report.stats.summary.totalBudget > 0
    ? report.stats.summary.totalActual / report.stats.summary.totalBudget
    : 0;
  const top = report.recommendations[0];

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `📊 费用分析报告 · ${periodLabel}`, emoji: true },
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: `🤖 ${report.ai_model}  ·  生成于 ${new Date(report.created_at).toLocaleString("zh-CN")}` },
      ],
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: report.summary },
    },
    { type: "divider" },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*统计异常*\n${report.anomalies.length} 项` },
        { type: "mrkdwn", text: `*真异常*\n${realAnomalies} 项` },
        { type: "mrkdwn", text: `*实际 / 预算*\n¥${wan(report.stats.summary.totalActual)}万 / ¥${wan(report.stats.summary.totalBudget)}万` },
        { type: "mrkdwn", text: `*总消化率*\n${pct(totalRate)}` },
      ],
    },
  ];

  if (top) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*🎯 最高优先级建议*\n*【${top.priority}】${top.title}*\n_${top.expectedImpact}_`,
      },
    });
  }

  if (report.google_doc_url) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "📄 查看完整 Google Doc 报告", emoji: true },
          url: report.google_doc_url,
          style: "primary",
        },
      ],
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      blocks,
      text: `费用分析报告 ${periodLabel}`, // 通知预览的 fallback 文本
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Slack webhook ${res.status}: ${body.slice(0, 300)}`);
  }
}
