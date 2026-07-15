import { NextResponse } from "next/server";
import { fetchMonthlyCases } from "@/lib/kintone";
import { buildMonthlyReport } from "@/lib/profit-calc";
import type { GroupedSummary, MonthlyReport } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function fmtShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (abs >= 10_000) return (n / 1_000).toFixed(0) + "K";
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + "K";
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

function dimGetter(currency: "jpy" | "cny") {
  return (
    g: GroupedSummary,
    key: "mitsumori" | "country" | "opExport" | "opImport" | "kanFee"
  ): number => {
    const jpy = currency === "jpy";
    if (key === "mitsumori") return jpy ? g.mitsumoriJpy : g.mitsumoriCny;
    if (key === "country") return jpy ? g.countryJpy : g.countryCny;
    if (key === "opExport") return jpy ? g.opExportJpy : g.opExportCny;
    if (key === "opImport") return jpy ? g.opImportJpy : g.opImportCny;
    return jpy ? g.kanFeeJpy : g.kanFeeCny;
  };
}

function buildTable(report: MonthlyReport, currency: "jpy" | "cny"): string {
  const get = dimGetter(currency);
  const dimKeys: Array<"mitsumori" | "country" | "opExport" | "opImport" | "kanFee"> = [
    "mitsumori",
    "country",
    "opExport",
    "opImport",
    "kanFee",
  ];
  const rowTotalOf = (g: GroupedSummary) =>
    dimKeys.reduce((s, k) => s + Math.round(get(g, k)), 0);
  const total = report.groupedSummaries.reduce((s, g) => s + rowTotalOf(g), 0);
  const lines: string[] = [];
  lines.push(
    padW("小组", 12) +
      padW("案件", 5) +
      padW("見積20%", 10) +
      padW("国別35%", 10) +
      padW("操出27%", 10) +
      padW("操入18%", 10) +
      padW("自社通", 10) +
      padW("合计", 12) +
      "占比"
  );
  lines.push("─".repeat(85));
  const cell = (n: number) => (Math.abs(n) < 0.01 ? "-" : "¥" + fmtShort(n));
  for (const g of report.groupedSummaries) {
    const amount = rowTotalOf(g);
    lines.push(
      padW(g.name, 12) +
        padW(String(g.caseCount), 5) +
        padW(cell(get(g, "mitsumori")), 10) +
        padW(cell(get(g, "country")), 10) +
        padW(cell(get(g, "opExport")), 10) +
        padW(cell(get(g, "opImport")), 10) +
        padW(cell(get(g, "kanFee")), 10) +
        padW("¥" + fmtShort(amount), 12) +
        pct(amount, total)
    );
  }
  const sumM = report.groupedSummaries.reduce((s, g) => s + get(g, "mitsumori"), 0);
  const sumC = report.groupedSummaries.reduce((s, g) => s + get(g, "country"), 0);
  const sumOE = report.groupedSummaries.reduce((s, g) => s + get(g, "opExport"), 0);
  const sumOI = report.groupedSummaries.reduce((s, g) => s + get(g, "opImport"), 0);
  const sumKF = report.groupedSummaries.reduce((s, g) => s + get(g, "kanFee"), 0);
  lines.push("─".repeat(85));
  lines.push(
    padW("合计", 12) +
      padW(String(report.totalCases), 5) +
      padW(cell(sumM), 10) +
      padW(cell(sumC), 10) +
      padW(cell(sumOE), 10) +
      padW(cell(sumOI), 10) +
      padW(cell(sumKF), 10) +
      padW("¥" + fmtShort(total), 12) +
      "100%"
  );
  return lines.join("\n");
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

    const jpyTable = buildTable(report, "jpy");
    const cnyTable = buildTable(report, "cny");

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
            text: "*各小组分得（JPY）*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "```\n" + jpyTable + "\n```",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*各小组分得（CNY）*",
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "```\n" + cnyTable + "\n```",
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
