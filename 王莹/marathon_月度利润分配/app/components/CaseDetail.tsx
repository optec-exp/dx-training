"use client";

import type { CaseAllocation, Currency, MonthlyReport } from "@/lib/types";

interface Props {
  report: MonthlyReport;
  teams: string[];
  groupName: string;
  currency: Currency;
}

const BASIS_LABEL: Record<string, string> = {
  ec_full: "EC 全归",
  kan_full: "通关全归",
  kan_fee: "通关请求合计",
  mitsumori: "見積 20%",
  country: "顾客所在国 35%",
  operation_export: "操作-輸出",
  operation_import: "操作-輸入",
};

const APP_LABEL: Record<string, string> = {
  air: "Air",
  sea: "SEA",
  ec: "EC",
};

function fmtMoney(n: number, currency: Currency): string {
  const rounded = Math.round(n);
  return `¥${rounded.toLocaleString("en-US")}`;
}

export function CaseDetail({ report, teams, groupName, currency }: Props) {
  const teamSet = new Set(teams);

  const grouped = new Map<
    string,
    { ca: CaseAllocation; amount: number; team: string; bases: string[] }
  >();

  for (const ca of report.caseAllocations) {
    for (const a of ca.allocations) {
      if (!teamSet.has(a.team)) continue;
      const amount = currency === "jpy" ? a.jpy : a.cny;
      const key = `${ca.case.recordId}::${a.team}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.amount += amount;
        if (!existing.bases.includes(a.basis)) existing.bases.push(a.basis);
      } else {
        grouped.set(key, {
          ca,
          amount,
          team: a.team,
          bases: [a.basis],
        });
      }
    }
  }

  const rows = Array.from(grouped.values())
    .filter((r) => Math.abs(r.amount) >= 0.01)
    .sort((a, b) => b.amount - a.amount);

  if (rows.length === 0) {
    return (
      <div className="mx-6 my-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
        {groupName} 在本月没有分配明细
      </div>
    );
  }

  const showTeamColumn = teams.length > 1;

  return (
    <div className="mx-6 my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <table className="w-full text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">案件番号</th>
            <th className="px-3 py-2 text-left font-medium">类别</th>
            {showTeamColumn && (
              <th className="px-3 py-2 text-left font-medium">归属小组</th>
            )}
            <th className="px-3 py-2 text-left font-medium">顾客名</th>
            <th className="px-3 py-2 text-left font-medium">国コード</th>
            <th className="px-3 py-2 text-left font-medium">分配依据</th>
            <th className="px-3 py-2 text-right font-medium">分得金额</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr key={`${row.ca.case.recordId}-${row.team}-${idx}`} className="hover:bg-white">
              <td className="px-3 py-2 font-mono">{row.ca.case.caseNumber || "-"}</td>
              <td className="px-3 py-2">{APP_LABEL[row.ca.case.appType]}</td>
              {showTeamColumn && <td className="px-3 py-2 font-medium">{row.team}</td>}
              <td className="px-3 py-2">{row.ca.case.customerName || "-"}</td>
              <td className="px-3 py-2">{row.ca.case.customerCountry || "-"}</td>
              <td className="px-3 py-2 text-slate-500">
                {row.bases.map((b) => BASIS_LABEL[b] ?? b).join(" + ")}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">
                {fmtMoney(row.amount, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
