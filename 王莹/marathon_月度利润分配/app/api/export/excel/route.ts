import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { fetchMonthlyCases } from "@/lib/kintone";
import { buildMonthlyReport } from "@/lib/profit-calc";
import type { Currency } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const APP_LABEL: Record<string, string> = {
  air: "Air",
  sea: "SEA",
  ec: "EC",
};

const BASIS_LABEL: Record<string, string> = {
  ec_full: "EC 全归",
  kan_full: "通关全归",
  kan_fee: "通关请求合计",
  mitsumori: "見積 20%",
  country: "顾客所在国 35%",
  operation_export: "操作-輸出",
  operation_import: "操作-輸入",
};

function moneyFor(jpy: number, cny: number, currency: Currency): number {
  return currency === "jpy" ? jpy : cny;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  const month = parseInt(searchParams.get("month") ?? "", 10);

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return NextResponse.json({ error: "需要 year/month" }, { status: 400 });
  }

  try {
    const { cases, fetchedAt, fromCache } = await fetchMonthlyCases(year, month);
    const report = buildMonthlyReport(year, month, cases, { fetchedAt, fromCache });

    const wb = new ExcelJS.Workbook();
    wb.creator = "月度利润自动分配";
    wb.created = new Date();

    const buildSummarySheet = (
      sheetName: string,
      currency: "jpy" | "cny",
      totalProfit: number
    ) => {
      const currencyLabel = currency === "jpy" ? "JPY" : "CNY";
      const sheet = wb.addWorksheet(sheetName);
      sheet.columns = [
        { header: "小组", key: "team", width: 18 },
        { header: "案件数", key: "count", width: 10 },
        { header: "見積 20%", key: "mitsumori", width: 16, style: { numFmt: "#,##0" } },
        { header: "顾客所在国 35%", key: "country", width: 18, style: { numFmt: "#,##0" } },
        { header: "操作-輸出 27%", key: "opExport", width: 16, style: { numFmt: "#,##0" } },
        { header: "操作-輸入 18%", key: "opImport", width: 16, style: { numFmt: "#,##0" } },
        { header: "自社通关", key: "kanFee", width: 16, style: { numFmt: "#,##0" } },
        { header: `合计 (${currencyLabel})`, key: "total", width: 18, style: { numFmt: "#,##0" } },
        { header: "占比", key: "pct", width: 10, style: { numFmt: "0.0%" } },
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
          team: g.name,
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
        team: "合计",
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

    buildSummarySheet("小组汇总 JPY", "jpy", report.totalProfitJpy);
    buildSummarySheet("小组汇总 CNY", "cny", report.totalProfitCny);

    const detailSheet = wb.addWorksheet("案件明细");
    detailSheet.columns = [
      { header: "案件类别", key: "appType", width: 10 },
      { header: "案件番号", key: "caseNo", width: 20 },
      { header: "顾客名", key: "customer", width: 24 },
      { header: "国コード", key: "country", width: 10 },
      { header: "輸出对应", key: "exportTeam", width: 14 },
      { header: "輸入对应", key: "importTeam", width: 14 },
      { header: "見積チーム", key: "mitsumori", width: 14 },
      { header: "粗利益 JPY", key: "grossJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "粗利益 CNY", key: "grossCny", width: 16, style: { numFmt: "#,##0" } },
      { header: "請求合計 JPY", key: "kanJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "請求合計 CNY", key: "kanCny", width: 16, style: { numFmt: "#,##0" } },
      { header: "分配小组", key: "team", width: 14 },
      { header: "分配依据", key: "basis", width: 18 },
      { header: "分得 JPY", key: "shareJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "分得 CNY", key: "shareCny", width: 16, style: { numFmt: "#,##0" } },
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
          team,
          basis: v.bases.map((b) => BASIS_LABEL[b] ?? b).join(" + "),
          shareJpy: Math.round(v.jpy),
          shareCny: Math.round(v.cny),
        });
      }
    }

    const buf = await wb.xlsx.writeBuffer();
    const filename = `月度利润分配_${year}年${month}月.xlsx`;
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
