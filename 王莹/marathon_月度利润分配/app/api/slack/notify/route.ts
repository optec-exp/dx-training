import { NextResponse } from "next/server";
import { fetchMonthlyCases } from "@/lib/kintone";
import { buildMonthlyReport } from "@/lib/profit-calc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function pct(n: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0) ?? 0;
    if (
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0x9fff) ||
      (code >= 0xa000 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe4f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      w += 2;
    } else {
      w += 1;
    }
  }
  return w;
}

function padW(s: string, width: number): string {
  const w = displayWidth(s);
  if (w >= width) return s;
  return s + " ".repeat(width - w);
}

export async function POST(req: Request) {
  let body: { year?: number; month?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体必须是 JSON" }, { status: 400 });
  }

  const year = Number(body.year);
  const month = Number(body.month);
  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "需要 year/month" }, { status: 400 });
  }

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return NextResponse.json(
      { error: "未配置 SLACK_WEBHOOK_URL" },
      { status: 500 }
    );
  }

  try {
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(year, month);
    const report = buildMonthlyReport(year, month, cases, { fetchedAt, fromCache });

    const kanFeeJpyTotal = report.groupedSummaries.reduce((s, g) => s + g.kanFeeJpy, 0);
    const kanFeeCnyTotal = report.groupedSummaries.reduce((s, g) => s + g.kanFeeCny, 0);
    const overview =
      `• 案件数：*${report.totalCases}* 件\n` +
      `• 利润合计 JPY：*¥${fmt(report.totalProfitJpy)}*\n` +
      `• 利润合计 CNY：*¥${fmt(report.totalProfitCny)}*\n` +
      `• 自社通关合计（含在通关小组）：JPY *¥${fmt(kanFeeJpyTotal)}* / CNY *¥${fmt(kanFeeCnyTotal)}*`;

    const tableLines: string[] = [];
    tableLines.push(
      padW("小组", 16) +
        padW("案件", 8) +
        padW("JPY", 16) +
        padW("CNY", 14) +
        "占比"
    );
    tableLines.push("─".repeat(60));
    for (const g of report.groupedSummaries) {
      tableLines.push(
        padW(g.name, 16) +
          padW(String(g.caseCount), 8) +
          padW("¥" + fmt(g.totalJpy), 16) +
          padW("¥" + fmt(g.totalCny), 14) +
          pct(g.totalJpy, report.totalProfitJpy)
      );
      if (g.isGroup && g.children) {
        for (const c of g.children) {
          tableLines.push(
            padW("  └ " + c.team, 16) +
              padW(String(c.caseCount), 8) +
              padW("¥" + fmt(c.totalJpy), 16) +
              padW("¥" + fmt(c.totalCny), 14) +
              pct(c.totalJpy, report.totalProfitJpy)
          );
        }
      }
    }

    const payload = {
      text: `${year}年${month}月 月度利润分配报告`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `📊 ${year}年${month}月 月度利润分配报告`,
            emoji: true,
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: overview },
        },
        { type: "divider" },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*各小组分得（按 JPY 高到低）*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "```\n" + tableLines.join("\n") + "\n```",
          },
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `_由 月度利润自动分配 系统生成 · ${new Date().toLocaleString("zh-CN")}_`,
            },
          ],
        },
      ],
    };

    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(
        `[Slack notify] ${new Date().toISOString()} 失败 ${year}/${month} ` +
          `status=${res.status} body=${text}`
      );
      return NextResponse.json(
        { error: `Slack 返回 ${res.status}: ${text}` },
        { status: 500 }
      );
    }

    console.log(
      `[Slack notify] ${new Date().toISOString()} 成功 ${year}/${month} ` +
        `(${report.totalCases} 件案件，${report.summaries.length} 个小组)`
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : "";
    console.error(
      `[Slack notify] ${new Date().toISOString()} 异常 ${year}/${month}: ${msg}\n${stack}`
    );
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
