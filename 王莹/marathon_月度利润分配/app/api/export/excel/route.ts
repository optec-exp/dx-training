import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { fetchMonthlyCases } from "@/lib/kintone";
import { buildMonthlyReport } from "@/lib/profit-calc";
import { normalizeLang, t as translate, teamName, type TranslationKey } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const APP_LABEL: Record<string, string> = {
  air: "Air",
  sea: "SEA",
  ec: "EC",
};

const BASIS_KEY: Record<string, TranslationKey> = {
  ec_full: "basisEcFull",
  kan_full: "basisKanFull",
  kan_fee: "basisKanFee",
  mitsumori: "basisMitsumori",
  country: "basisCountry",
  operation_export: "basisOpExport",
  operation_import: "basisOpImport",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);
  const lang = normalizeLang(searchParams.get("lang"));
  const tr = (key: TranslationKey, params?: Record<string, string | number>) =>
    translate(lang, key, params);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "需要 year/month" }, { status: 400 });
  }

  try {
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(year, month);
    const report = buildMonthlyReport(year, month, cases, { fetchedAt, fromCache });

    const wb = new ExcelJS.Workbook();
    wb.creator = tr("appTitle");
    wb.created = new Date();

    const buildSummarySheet = (
      sheetName: string,
      currency: "jpy" | "cny",
      totalProfit: number
    ) => {
      const currencyLabel = currency === "jpy" ? "JPY" : "CNY";
      const sheet = wb.addWorksheet(sheetName);
      sheet.columns = [
        { header: tr("colTeam"), key: "team", width: 18 },
        { header: tr("colCaseCount"), key: "count", width: 10 },
        { header: `${tr("colMitsumori")} 20%`, key: "mitsumori", width: 16, style: { numFmt: "#,##0" } },
        { header: `${tr("colCountry")} 35%`, key: "country", width: 18, style: { numFmt: "#,##0" } },
        { header: `${tr("colOpExport")} 27%`, key: "opExport", width: 16, style: { numFmt: "#,##0" } },
        { header: `${tr("colOpImport")} 18%`, key: "opImport", width: 16, style: { numFmt: "#,##0" } },
        { header: tr("colKanFee"), key: "kanFee", width: 16, style: { numFmt: "#,##0" } },
        { header: `${tr("colTotal")} (${currencyLabel})`, key: "total", width: 18, style: { numFmt: "#,##0" } },
        { header: tr("colRatio"), key: "pct", width: 10, style: { numFmt: "0.0%" } },
      ];
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };

      const pick = (n: { jpy: number; cny: number }) => (currency === "jpy" ? n.jpy : n.cny);
      const dim = (g: (typeof report.groupedSummaries)[number], key: "mitsumori" | "country" | "opExport" | "opImport" | "kanFee") => {
        if (key === "mitsumori") return pick({ jpy: g.mitsumoriJpy, cny: g.mitsumoriCny });
        if (key === "country") return pick({ jpy: g.countryJpy, cny: g.countryCny });
        if (key === "opExport") return pick({ jpy: g.opExportJpy, cny: g.opExportCny });
        if (key === "opImport") return pick({ jpy: g.opImportJpy, cny: g.opImportCny });
        return pick({ jpy: g.kanFeeJpy, cny: g.kanFeeCny });
      };
      const totalOr1 = totalProfit || 1;
      const rowTotals: number[] = [];
      for (const g of report.groupedSummaries) {
        const dims = {
          mitsumori: Math.round(dim(g, "mitsumori")),
          country: Math.round(dim(g, "country")),
          opExport: Math.round(dim(g, "opExport")),
          opImport: Math.round(dim(g, "opImport")),
          kanFee: Math.round(dim(g, "kanFee")),
        };
        const rowTotal = dims.mitsumori + dims.country + dims.opExport + dims.opImport + dims.kanFee;
        rowTotals.push(rowTotal);
        sheet.addRow({
          team: teamName(lang, g.name),
          count: g.caseCount,
          ...dims,
          total: rowTotal,
          pct: rowTotal / totalOr1,
        });
      }
      const sumM = report.groupedSummaries.reduce((s, g) => s + Math.round(dim(g, "mitsumori")), 0);
      const sumC = report.groupedSummaries.reduce((s, g) => s + Math.round(dim(g, "country")), 0);
      const sumOE = report.groupedSummaries.reduce((s, g) => s + Math.round(dim(g, "opExport")), 0);
      const sumOI = report.groupedSummaries.reduce((s, g) => s + Math.round(dim(g, "opImport")), 0);
      const sumKF = report.groupedSummaries.reduce((s, g) => s + Math.round(dim(g, "kanFee")), 0);
      const totalRow = sheet.addRow({
        team: tr("colTotal"),
        count: report.totalCases,
        mitsumori: sumM,
        country: sumC,
        opExport: sumOE,
        opImport: sumOI,
        kanFee: sumKF,
        total: sumM + sumC + sumOE + sumOI + sumKF,
        pct: 1,
      });
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
    };

    buildSummarySheet(tr("sheetSummaryJpy"), "jpy", report.totalProfitJpy);
    buildSummarySheet(tr("sheetSummaryCny"), "cny", report.totalProfitCny);

    const detailSheet = wb.addWorksheet(tr("sheetDetail"));
    detailSheet.columns = [
      { header: tr("colCategory"), key: "appType", width: 10 },
      { header: tr("colCaseNumber"), key: "caseNo", width: 20 },
      { header: tr("colCustomer"), key: "customer", width: 24 },
      { header: tr("colCountryCode"), key: "country", width: 10 },
      { header: `${tr("lblExport")} ${tr("colTeam")}`, key: "exportTeam", width: 14 },
      { header: `${tr("lblImport")} ${tr("colTeam")}`, key: "importTeam", width: 14 },
      { header: `${tr("lblMitsumori")} ${tr("colTeam")}`, key: "mitsumori", width: 14 },
      { header: `${tr("lblGrossProfit")} JPY`, key: "grossJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: `${tr("lblGrossProfit")} CNY`, key: "grossCny", width: 16, style: { numFmt: "#,##0" } },
      { header: `${tr("lblKanFeeTotal")} JPY`, key: "kanJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: `${tr("lblKanFeeTotal")} CNY`, key: "kanCny", width: 16, style: { numFmt: "#,##0" } },
      { header: tr("colOwnerTeam"), key: "team", width: 14 },
      { header: tr("colAllocationBasis"), key: "basis", width: 18 },
      { header: `${tr("colShareAmount")} JPY`, key: "shareJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: `${tr("colShareAmount")} CNY`, key: "shareCny", width: 16, style: { numFmt: "#,##0" } },
    ];
    detailSheet.getRow(1).font = { bold: true };
    detailSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };

    for (const ca of report.caseAllocations) {
      const c = ca.case;
      const byTeam = new Map<
        string,
        { jpy: number; cny: number; bases: string[] }
      >();
      for (const a of ca.allocations) {
        const existing = byTeam.get(a.team);
        if (existing) {
          existing.jpy += a.jpy;
          existing.cny += a.cny;
          if (!existing.bases.includes(a.basis)) existing.bases.push(a.basis);
        } else {
          byTeam.set(a.team, { jpy: a.jpy, cny: a.cny, bases: [a.basis] });
        }
      }
      for (const [team, v] of byTeam) {
        detailSheet.addRow({
          appType: APP_LABEL[c.appType],
          caseNo: c.caseNumber,
          customer: c.customerName,
          country: c.customerCountry,
          exportTeam: c.exportTeam,
          importTeam: c.importTeam,
          mitsumori: c.mitsumoriTeam ?? "",
          grossJpy: Math.round(c.grossProfitJpy),
          grossCny: Math.round(c.grossProfitCny),
          kanJpy: Math.round(c.kanFeeJpy),
          kanCny: Math.round(c.kanFeeCny),
          team: teamName(lang, team),
          basis: v.bases.map((b) => tr(BASIS_KEY[b] ?? "basisMitsumori")).join(" + "),
          shareJpy: Math.round(v.jpy),
          shareCny: Math.round(v.cny),
        });
      }
    }

    const buf = await wb.xlsx.writeBuffer();
    const filename = `${tr("appTitle")}_${year}${tr("labelYear")}${month}${tr("labelMonth")}.xlsx`;
    return new NextResponse(buf as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
