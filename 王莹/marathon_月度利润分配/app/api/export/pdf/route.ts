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
import { normalizeLang, t as translate, teamName, type Lang, type TranslationKey } from "@/lib/i18n";

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
    fontSize: 8,
    padding: 28,
    backgroundColor: "#fff",
    color: "#1e293b",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 7,
    color: "#64748b",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 8,
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
    paddingHorizontal: 3,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 3,
    paddingHorizontal: 3,
  },
  rowTotal: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: "#94a3b8",
    paddingVertical: 4,
    paddingHorizontal: 3,
    backgroundColor: "#f1f5f9",
    fontWeight: "bold",
  },
  cellTeam: { width: "13%" },
  cellCount: { width: "8%", textAlign: "right" },
  cellDim: { width: "12%", textAlign: "right" },
  cellTotal: { width: "14%", textAlign: "right" },
  cellPct: { width: "9%", textAlign: "right" },
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

function dimCell(n: number): string {
  if (Math.abs(n) < 0.01) return "-";
  return `¥${fmt(n)}`;
}

function CurrencyPage({
  report,
  currency,
  lang,
}: {
  report: MonthlyReport;
  currency: "jpy" | "cny";
  lang: Lang;
}) {
  const e = React.createElement;
  const tr = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(lang, key, params);
  const totalProfit = currency === "jpy" ? report.totalProfitJpy : report.totalProfitCny;
  const currencyLabel = currency === "jpy" ? "JPY" : "CNY";

  const getDim = (
    g: (typeof report.groupedSummaries)[number],
    key: "mitsumori" | "country" | "opExport" | "opImport" | "kanFee"
  ): number => {
    const jpy = currency === "jpy";
    if (key === "mitsumori") return jpy ? g.mitsumoriJpy : g.mitsumoriCny;
    if (key === "country") return jpy ? g.countryJpy : g.countryCny;
    if (key === "opExport") return jpy ? g.opExportJpy : g.opExportCny;
    if (key === "opImport") return jpy ? g.opImportJpy : g.opImportCny;
    return jpy ? g.kanFeeJpy : g.kanFeeCny;
  };

  const dimSum = (key: "mitsumori" | "country" | "opExport" | "opImport" | "kanFee") =>
    report.groupedSummaries.reduce((s, g) => s + Math.round(getDim(g, key)), 0);

  const rowTotal = (g: (typeof report.groupedSummaries)[number]) =>
    Math.round(getDim(g, "mitsumori")) +
    Math.round(getDim(g, "country")) +
    Math.round(getDim(g, "opExport")) +
    Math.round(getDim(g, "opImport")) +
    Math.round(getDim(g, "kanFee"));

  const grandTotal =
    dimSum("mitsumori") + dimSum("country") + dimSum("opExport") + dimSum("opImport") + dimSum("kanFee");

  return e(
    Page,
    { size: "A4", orientation: "landscape", style: styles.page },
    e(
      Text,
      { style: styles.title },
      `${tr("pdfTitle")} ${report.year}${tr("labelYear")}${report.month}${tr("labelMonth")} (${currencyLabel})`
    ),
    e(
      Text,
      { style: styles.subtitle },
      `${tr("pdfGeneratedAt")} ${new Date().toLocaleString(lang === "ja" ? "ja-JP" : "zh-CN")}`
    ),
    e(
      View,
      { style: styles.statsRow },
      e(
        View,
        { style: styles.statCard },
        e(Text, { style: styles.statLabel }, tr("statTotalCases")),
        e(Text, { style: styles.statValue }, String(report.totalCases))
      ),
      e(
        View,
        { style: styles.statCard },
        e(Text, { style: styles.statLabel }, `${tr("statTotalProfit")}（${currencyLabel}）`),
        e(Text, { style: styles.statValue }, `¥${fmt(grandTotal)}`)
      )
    ),
    e(Text, { style: styles.sectionHeading }, tr("pdfSectionHeading")),
    e(
      View,
      { style: styles.table },
      e(
        View,
        { style: styles.rowHeader },
        e(Text, { style: styles.cellTeam }, tr("colTeam")),
        e(Text, { style: styles.cellCount }, tr("colCaseCount")),
        e(Text, { style: styles.cellDim }, `${tr("colMitsumori")} 20%`),
        e(Text, { style: styles.cellDim }, `${tr("colCountry")} 35%`),
        e(Text, { style: styles.cellDim }, `${tr("colOpExport")} 27%`),
        e(Text, { style: styles.cellDim }, `${tr("colOpImport")} 18%`),
        e(Text, { style: styles.cellDim }, tr("colKanFee")),
        e(Text, { style: styles.cellTotal }, `${tr("colTotal")} (${currencyLabel})`),
        e(Text, { style: styles.cellPct }, tr("colRatio"))
      ),
      ...report.groupedSummaries.map((g) => {
        const amount = rowTotal(g);
        return e(
          View,
          { style: styles.row, key: `g-${g.name}` },
          e(Text, { style: styles.cellTeam }, teamName(lang, g.name)),
          e(Text, { style: styles.cellCount }, String(g.caseCount)),
          e(Text, { style: styles.cellDim }, dimCell(getDim(g, "mitsumori"))),
          e(Text, { style: styles.cellDim }, dimCell(getDim(g, "country"))),
          e(Text, { style: styles.cellDim }, dimCell(getDim(g, "opExport"))),
          e(Text, { style: styles.cellDim }, dimCell(getDim(g, "opImport"))),
          e(Text, { style: styles.cellDim }, dimCell(getDim(g, "kanFee"))),
          e(Text, { style: styles.cellTotal }, `¥${fmt(amount)}`),
          e(Text, { style: styles.cellPct }, pct(amount, totalProfit))
        );
      }),
      e(
        View,
        { style: styles.rowTotal },
        e(Text, { style: styles.cellTeam }, tr("colTotal")),
        e(Text, { style: styles.cellCount }, String(report.totalCases)),
        e(Text, { style: styles.cellDim }, dimCell(dimSum("mitsumori"))),
        e(Text, { style: styles.cellDim }, dimCell(dimSum("country"))),
        e(Text, { style: styles.cellDim }, dimCell(dimSum("opExport"))),
        e(Text, { style: styles.cellDim }, dimCell(dimSum("opImport"))),
        e(Text, { style: styles.cellDim }, dimCell(dimSum("kanFee"))),
        e(Text, { style: styles.cellTotal }, `¥${fmt(grandTotal)}`),
        e(Text, { style: styles.cellPct }, "100.0%")
      )
    ),
    e(Text, {
      style: styles.footer,
      fixed: true,
      render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
        tr("pdfPage", { n: pageNumber, total: totalPages }),
    })
  );
}

function ReportDoc({ report, lang }: { report: MonthlyReport; lang: Lang }) {
  const e = React.createElement;
  return e(
    Document,
    null,
    e(CurrencyPage, { report, currency: "jpy", lang }),
    e(CurrencyPage, { report, currency: "cny", lang })
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);
  const lang = normalizeLang(searchParams.get("lang"));

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "需要 year/month" }, { status: 400 });
  }

  try {
    ensureFont();
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(year, month);
    const report = buildMonthlyReport(year, month, cases, { fetchedAt, fromCache });

    const doc = React.createElement(ReportDoc, { report, lang });
    const stream = await pdf(doc as React.ReactElement).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    const buf = Buffer.concat(chunks);

    const filename = `${translate(lang, "appTitle")}_${year}${translate(lang, "labelYear")}${month}${translate(lang, "labelMonth")}.pdf`;
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
