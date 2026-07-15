"use client";

import type {
  Currency,
  GroupedSummary,
  MonthlyReport,
  TeamSummary,
} from "@/lib/types";

interface Props {
  report: MonthlyReport;
  currency: Currency;
  expandedTeam: string | null;
  onToggleDetail: (key: string) => void;
}

function fmtMoney(n: number): string {
  const rounded = Math.round(n);
  return `¥${rounded.toLocaleString("en-US")}`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

type DimKey = "mitsumori" | "country" | "opExport" | "opImport" | "kanFee";

function dimAmount(
  s: GroupedSummary | TeamSummary,
  key: DimKey,
  currency: Currency
): number {
  if (currency === "jpy") {
    if (key === "mitsumori") return s.mitsumoriJpy;
    if (key === "country") return s.countryJpy;
    if (key === "opExport") return s.opExportJpy;
    if (key === "opImport") return s.opImportJpy;
    return s.kanFeeJpy;
  }
  if (key === "mitsumori") return s.mitsumoriCny;
  if (key === "country") return s.countryCny;
  if (key === "opExport") return s.opExportCny;
  if (key === "opImport") return s.opImportCny;
  return s.kanFeeCny;
}

function dimCell(n: number): string {
  if (Math.abs(n) < 0.01) return "-";
  return fmtMoney(n);
}

const DIM_KEYS: DimKey[] = ["mitsumori", "country", "opExport", "opImport", "kanFee"];

function displayTotal(
  s: GroupedSummary | TeamSummary,
  currency: Currency
): number {
  return DIM_KEYS.reduce((sum, k) => sum + Math.round(dimAmount(s, k, currency)), 0);
}

export function SummaryTable({
  report,
  currency,
  expandedTeam,
  onToggleDetail,
}: Props) {
  const total = currency === "jpy" ? report.totalProfitJpy : report.totalProfitCny;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">小组</th>
            <th className="px-4 py-3 text-right font-medium">案件数</th>
            <th className="px-4 py-3 text-right font-medium">見積 20%</th>
            <th className="px-4 py-3 text-right font-medium">顾客所在国 35%</th>
            <th className="px-4 py-3 text-right font-medium">操作-輸出 27%</th>
            <th className="px-4 py-3 text-right font-medium">操作-輸入 18%</th>
            <th className="px-4 py-3 text-right font-medium">自社通关</th>
            <th className="px-4 py-3 text-right font-medium">
              合计（{currency === "jpy" ? "JPY" : "CNY"}）
            </th>
            <th className="px-4 py-3 text-right font-medium">占比</th>
            <th className="px-4 py-3 text-right font-medium w-20"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {report.groupedSummaries.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-slate-400" colSpan={10}>
                本月暂无利润数据
              </td>
            </tr>
          )}

          {report.groupedSummaries.map((g) => {
            const amount = displayTotal(g, currency);
            const pct = total === 0 ? 0 : amount / total;
            const detailKey = `group:${g.name}`;
            const isDetailOpen = expandedTeam === detailKey;

            return (
              <tr key={g.name} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{g.name}</td>
                <td className="px-4 py-3 text-right tabular-nums">{g.caseCount}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {dimCell(dimAmount(g, "mitsumori", currency))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {dimCell(dimAmount(g, "country", currency))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {dimCell(dimAmount(g, "opExport", currency))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {dimCell(dimAmount(g, "opImport", currency))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {dimCell(dimAmount(g, "kanFee", currency))}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {fmtMoney(amount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {fmtPct(pct)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onToggleDetail(detailKey)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {isDetailOpen ? "收起" : "明细"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        {report.groupedSummaries.length > 0 && (
          <tfoot className="bg-slate-50 font-medium">
            <tr>
              <td className="px-4 py-3 text-slate-700">合计</td>
              <td className="px-4 py-3 text-right tabular-nums">{report.totalCases}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "mitsumori", currency), 0)
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "country", currency), 0)
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "opExport", currency), 0)
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "opImport", currency), 0)
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "kanFee", currency), 0)
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {fmtMoney(
                  report.groupedSummaries.reduce((sum, g) => sum + displayTotal(g, currency), 0)
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">100.0%</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
