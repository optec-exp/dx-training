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
  expandedGroups: Set<string>;
  expandedTeam: string | null;
  onToggleGroup: (group: string) => void;
  onToggleDetail: (key: string) => void;
}

function fmtMoney(n: number, currency: Currency): string {
  const rounded = Math.round(n);
  return currency === "jpy" ? `¥${rounded.toLocaleString("en-US")}` : `¥${rounded.toLocaleString("en-US")}`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

type DimKey = "mitsumori" | "country" | "opExport" | "opImport";

function dimAmount(
  s: GroupedSummary | TeamSummary,
  key: DimKey,
  currency: Currency
): number {
  if (currency === "jpy") {
    if (key === "mitsumori") return s.mitsumoriJpy;
    if (key === "country") return s.countryJpy;
    if (key === "opExport") return s.opExportJpy;
    return s.opImportJpy;
  }
  if (key === "mitsumori") return s.mitsumoriCny;
  if (key === "country") return s.countryCny;
  if (key === "opExport") return s.opExportCny;
  return s.opImportCny;
}

function dimCell(n: number, currency: Currency): string {
  if (Math.abs(n) < 0.01) return "-";
  return fmtMoney(n, currency);
}

export function SummaryTable({
  report,
  currency,
  expandedGroups,
  expandedTeam,
  onToggleGroup,
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
            <th className="px-4 py-3 text-right font-medium">見積</th>
            <th className="px-4 py-3 text-right font-medium">顾客所在国</th>
            <th className="px-4 py-3 text-right font-medium">操作-輸出</th>
            <th className="px-4 py-3 text-right font-medium">操作-輸入</th>
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
              <td className="px-4 py-8 text-center text-slate-400" colSpan={9}>
                本月暂无利润数据
              </td>
            </tr>
          )}

          {report.groupedSummaries.map((g) => {
            const amount = currency === "jpy" ? g.totalJpy : g.totalCny;
            const pct = total === 0 ? 0 : amount / total;
            const isGroupExpanded = expandedGroups.has(g.name);
            const detailKey = `group:${g.name}`;
            const isDetailOpen = expandedTeam === detailKey;

            return (
              <>
                <tr key={g.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {g.isGroup ? (
                      <button
                        type="button"
                        onClick={() => onToggleGroup(g.name)}
                        className="inline-flex items-center gap-1.5 text-slate-800 hover:text-indigo-700"
                      >
                        <span className="text-slate-400">{isGroupExpanded ? "▼" : "▶"}</span>
                        {g.name}
                        <span className="text-xs text-slate-400 font-normal">
                          ({g.children?.length ?? 0} 子组)
                        </span>
                      </button>
                    ) : (
                      g.name
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{g.caseCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {dimCell(dimAmount(g, "mitsumori", currency), currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {dimCell(dimAmount(g, "country", currency), currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {dimCell(dimAmount(g, "opExport", currency), currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {dimCell(dimAmount(g, "opImport", currency), currency)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {fmtMoney(amount, currency)}
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

                {g.isGroup &&
                  isGroupExpanded &&
                  g.children?.map((c) => {
                    const cAmount = currency === "jpy" ? c.totalJpy : c.totalCny;
                    const cPct = total === 0 ? 0 : cAmount / total;
                    const cDetailKey = `team:${c.team}`;
                    const cDetailOpen = expandedTeam === cDetailKey;

                    return (
                      <tr key={`${g.name}-${c.team}`} className="bg-slate-50/50 hover:bg-slate-100/60">
                        <td className="px-4 py-2 pl-12 text-slate-700">
                          <span className="text-slate-400 mr-2">└</span>
                          {c.team}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{c.caseCount}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                          {dimCell(dimAmount(c, "mitsumori", currency), currency)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                          {dimCell(dimAmount(c, "country", currency), currency)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                          {dimCell(dimAmount(c, "opExport", currency), currency)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                          {dimCell(dimAmount(c, "opImport", currency), currency)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">
                          {fmtMoney(cAmount, currency)}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-500">
                          {fmtPct(cPct)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onToggleDetail(cDetailKey)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            {cDetailOpen ? "收起" : "明细"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </>
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
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "mitsumori", currency), 0),
                  currency
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "country", currency), 0),
                  currency
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "opExport", currency), 0),
                  currency
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {dimCell(
                  report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, "opImport", currency), 0),
                  currency
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(total, currency)}</td>
              <td className="px-4 py-3 text-right tabular-nums">100.0%</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
