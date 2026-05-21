"use client";

import type { Currency, MonthlyReport, TeamSummary } from "@/lib/types";

interface Props {
  report: MonthlyReport;
  currency: Currency;
  expandedTeam: string | null;
  onToggleTeam: (team: string) => void;
}

function fmtMoney(n: number, currency: Currency): string {
  const rounded = Math.round(n);
  const s = rounded.toLocaleString("en-US");
  return currency === "jpy" ? `¥${s}` : `¥${s}`;
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function SummaryTable({ report, currency, expandedTeam, onToggleTeam }: Props) {
  const total = currency === "jpy" ? report.totalProfitJpy : report.totalProfitCny;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left font-medium">小组</th>
            <th className="px-4 py-3 text-right font-medium">案件数</th>
            <th className="px-4 py-3 text-right font-medium">
              利润合计（{currency === "jpy" ? "JPY" : "CNY"}）
            </th>
            <th className="px-4 py-3 text-right font-medium">占比</th>
            <th className="px-4 py-3 text-right font-medium w-24"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {report.summaries.length === 0 && (
            <tr>
              <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                本月暂无利润数据
              </td>
            </tr>
          )}
          {report.summaries.map((s: TeamSummary) => {
            const amount = currency === "jpy" ? s.totalJpy : s.totalCny;
            const pct = total === 0 ? 0 : amount / total;
            const isOpen = expandedTeam === s.team;
            return (
              <tr key={s.team} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{s.team}</td>
                <td className="px-4 py-3 text-right tabular-nums">{s.caseCount}</td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold">
                  {fmtMoney(amount, currency)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {fmtPct(pct)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onToggleTeam(s.team)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    {isOpen ? "收起" : "明细"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        {report.summaries.length > 0 && (
          <tfoot className="bg-slate-50 font-medium">
            <tr>
              <td className="px-4 py-3 text-slate-700">合计</td>
              <td className="px-4 py-3 text-right tabular-nums">{report.totalCases}</td>
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
