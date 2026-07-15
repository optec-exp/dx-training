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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  try {
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(year, month);
    const report = buildMonthlyReport(year, month, cases, { fetchedAt, fromCache });

    const jpyGrand = report.groupedSummaries.reduce(
      (s, g) =>
        s +
        Math.round(g.mitsumoriJpy) +
        Math.round(g.countryJpy) +
        Math.round(g.opExportJpy) +
        Math.round(g.opImportJpy) +
        Math.round(g.kanFeeJpy),
      0
    );
    const cnyGrand = report.groupedSummaries.reduce(
      (s, g) =>
        s +
        Math.round(g.mitsumoriCny) +
        Math.round(g.countryCny) +
        Math.round(g.opExportCny) +
        Math.round(g.opImportCny) +
        Math.round(g.kanFeeCny),
      0
    );

    const overview =
      `• 案件数：*${report.totalCases}* 件\n` +
      `• 利润合计 JPY：*¥${fmt(jpyGrand)}*\n` +
      `• 利润合计 CNY：*¥${fmt(cnyGrand)}*`;

    const rowTotalOf = (g: (typeof report.groupedSummaries)[number]) =>
      Math.round(g.mitsumoriJpy) +
      Math.round(g.countryJpy) +
      Math.round(g.opExportJpy) +
      Math.round(g.opImportJpy) +
      Math.round(g.kanFeeJpy);
    const groupsLines = report.groupedSummaries
      .map((g) => {
        const amount = rowTotalOf(g);
        return `• *${g.name}*：¥${fmt(amount)}  ·  ${pct(amount, jpyGrand)}`;
      })
      .join("\n");

    const link = appUrl
      ? `📊 <${appUrl}|查看完整数据（5 维度 / 双币种 / 案件明细 / Excel & PDF 下载）>`
      : "";

    const blocks: unknown[] = [
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
          text: `*各小组利润*\n${groupsLines}`,
        },
      },
    ];

    if (link) {
      blocks.push({ type: "divider" });
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: link },
      });
    }

    blocks.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `_由 月度利润自动分配 系统生成 · ${new Date().toLocaleString("zh-CN")}_`,
        },
      ],
    });

    const payload = {
      text: `${year}年${month}月 月度利润分配报告`,
      blocks,
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
        `(${report.totalCases} 件案件，${report.groupedSummaries.length} 个小组)`
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
