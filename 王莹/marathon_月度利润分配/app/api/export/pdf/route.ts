import { NextResponse } from "next/server";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import React from "react";
import { fetchMonthlyCases } from "@/lib/kintone";
import { buildMonthlyReport } from "@/lib/profit-calc";
import { findChineseFontPath } from "@/lib/pdf-font";
import type { MonthlyReport } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  const src = findChineseFontPath();
  Font.register({
    family: "CJK",
    src,
  });
  Font.registerHyphenationCallback((word) => [word]);
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "CJK",
    fontSize: 9,
    padding: 32,
    backgroundColor: "#fff",
    color: "#1e293b",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "bold",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  table: {
    width: "100%",
    borderTopWidth: 1,
    borderColor: "#cbd5e1",
  },
  rowHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  rowTotal: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "#94a3b8",
    paddingVertical: 4,
    paddingHorizontal: 4,
    backgroundColor: "#f1f5f9",
    fontWeight: "bold",
  },
  cellTeam: { width: "20%" },
  cellCount: { width: "14%", textAlign: "right" },
  cellMoney: { width: "26%", textAlign: "right" },
  cellPct: { width: "14%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function pct(n: number, total: number): string {
  if (total === 0) return "0.0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function ReportDoc({ report }: { report: MonthlyReport }) {
  const e = React.createElement;
  return e(
    Document,
    null,
    e(
      Page,
      { size: "A4", style: styles.page },
      e(Text, { style: styles.title }, `月度利润分配报告 ${report.year}年${report.month}月`),
      e(
        Text,
        { style: styles.subtitle },
        `Air / SEA / EC 案件按业务规则自动分配 · 生成于 ${new Date().toLocaleString("zh-CN")}`
      ),

      e(
        View,
        { style: styles.statsRow },
        e(
          View,
          { style: styles.statCard },
          e(Text, { style: styles.statLabel }, "案件数"),
          e(Text, { style: styles.statValue }, String(report.totalCases))
        ),
        e(
          View,
          { style: styles.statCard },
          e(Text, { style: styles.statLabel }, "本月利润合计（JPY）"),
          e(Text, { style: styles.statValue }, `¥${fmt(report.totalProfitJpy)}`)
        ),
        e(
          View,
          { style: styles.statCard },
          e(Text, { style: styles.statLabel }, "本月利润合计（CNY）"),
          e(Text, { style: styles.statValue }, `¥${fmt(report.totalProfitCny)}`)
        )
      ),

      e(Text, { style: styles.sectionHeading }, "各小组利润分配（按 JPY 高到低排序）"),
      e(
        View,
        { style: styles.table },
        e(
          View,
          { style: styles.rowHeader },
          e(Text, { style: styles.cellTeam }, "小组"),
          e(Text, { style: styles.cellCount }, "案件数"),
          e(Text, { style: styles.cellMoney }, "利润 (JPY)"),
          e(Text, { style: styles.cellMoney }, "利润 (CNY)"),
          e(Text, { style: styles.cellPct }, "占比 JPY")
        ),
        ...report.summaries.map((s) =>
          e(
            View,
            { style: styles.row, key: s.team },
            e(Text, { style: styles.cellTeam }, s.team),
            e(Text, { style: styles.cellCount }, String(s.caseCount)),
            e(Text, { style: styles.cellMoney }, `¥${fmt(s.totalJpy)}`),
            e(Text, { style: styles.cellMoney }, `¥${fmt(s.totalCny)}`),
            e(Text, { style: styles.cellPct }, pct(s.totalJpy, report.totalProfitJpy))
          )
        ),
        e(
          View,
          { style: styles.rowTotal },
          e(Text, { style: styles.cellTeam }, "合计"),
          e(Text, { style: styles.cellCount }, String(report.totalCases)),
          e(Text, { style: styles.cellMoney }, `¥${fmt(report.totalProfitJpy)}`),
          e(Text, { style: styles.cellMoney }, `¥${fmt(report.totalProfitCny)}`),
          e(Text, { style: styles.cellPct }, "100.0%")
        )
      ),

      e(
        Text,
        { style: styles.footer, fixed: true, render: ({ pageNumber, totalPages }) =>
            `第 ${pageNumber} / ${totalPages} 页`
        })
    )
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "需要 year/month" }, { status: 400 });
  }

  try {
    ensureFont();
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(year, month);
    const report = buildMonthlyReport(year, month, cases, { fetchedAt, fromCache });

    const doc = React.createElement(ReportDoc, { report });
    const stream = await pdf(doc as React.ReactElement).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buf = Buffer.concat(chunks);

    const filename = `月度利润分配_${year}年${month}月.pdf`;
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
