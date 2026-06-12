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

    const sumSheet = wb.addWorksheet("小组汇总");
    sumSheet.columns = [
      { header: "小组", key: "team", width: 18 },
      { header: "案件数", key: "count", width: 10 },
      { header: "見積 (JPY)", key: "mitsumoriJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "顾客所在国 (JPY)", key: "countryJpy", width: 18, style: { numFmt: "#,##0" } },
      { header: "操作-輸出 (JPY)", key: "opExportJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "操作-輸入 (JPY)", key: "opImportJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "自社通关 (JPY)", key: "kanFeeJpy", width: 16, style: { numFmt: "#,##0" } },
      { header: "合计 (JPY)", key: "jpy", width: 18, style: { numFmt: "#,##0" } },
      { header: "合计 (CNY)", key: "cny", width: 18, style: { numFmt: "#,##0" } },
      { header: "JPY 占比", key: "pctJpy", width: 10, style: { numFmt: "0.0%" } },
    ];
    sumSheet.getRow(1).font = { bold: true };
    sumSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };

    const totalJpy = report.totalProfitJpy || 1;
    const totalCny = report.totalProfitCny || 1;
    for (const g of report.groupedSummaries) {
      const groupRow = sumSheet.addRow({
        team: g.name,
        count: g.caseCount,
        mitsumoriJpy: Math.round(g.mitsumoriJpy),
        countryJpy: Math.round(g.countryJpy),
        opExportJpy: Math.round(g.opExportJpy),
        opImportJpy: Math.round(g.opImportJpy),
        kanFeeJpy: Math.round(g.kanFeeJpy),
        jpy: Math.round(g.totalJpy),
        cny: Math.round(g.totalCny),
        pctJpy: g.totalJpy / totalJpy,
      });
      if (g.isGroup) {
        groupRow.font = { bold: true };
        groupRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
      if (g.isGroup && g.children) {
        for (const c of g.children) {
          sumSheet.addRow({
            team: "    └ " + c.team,
            count: c.caseCount,
            mitsumoriJpy: Math.round(c.mitsumoriJpy),
            countryJpy: Math.round(c.countryJpy),
            opExportJpy: Math.round(c.opExportJpy),
            opImportJpy: Math.round(c.opImportJpy),
            kanFeeJpy: Math.round(c.kanFeeJpy),
            jpy: Math.round(c.totalJpy),
            cny: Math.round(c.totalCny),
            pctJpy: c.totalJpy / totalJpy,
          });
        }
      }
    }
    const sumM = report.groupedSummaries.reduce((s, g) => s + g.mitsumoriJpy, 0);
    const sumC = report.groupedSummaries.reduce((s, g) => s + g.countryJpy, 0);
    const sumOE = report.groupedSummaries.reduce((s, g) => s + g.opExportJpy, 0);
    const sumOI = report.groupedSummaries.reduce((s, g) => s + g.opImportJpy, 0);
    const sumKF = report.groupedSummaries.reduce((s, g) => s + g.kanFeeJpy, 0);
    const totalRow = sumSheet.addRow({
      team: "合计",
      count: report.totalCases,
      mitsumoriJpy: Math.round(sumM),
      countryJpy: Math.round(sumC),
      opExportJpy: Math.round(sumOE),
      opImportJpy: Math.round(sumOI),
      kanFeeJpy: Math.round(sumKF),
      jpy: Math.round(report.totalProfitJpy),
      cny: Math.round(report.totalProfitCny),
      pctJpy: 1,
    });
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE5E7EB" },
    };

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
