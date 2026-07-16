"use client";

import type { CaseAllocation, Currency, MonthlyReport } from "@/lib/types";
import { useLang } from "./LanguageProvider";
import { teamName, type TranslationKey } from "@/lib/i18n";

interface Props {
  report: MonthlyReport;
  teams: string[];
  groupName: string;
  currency: Currency;
}

const BASIS_LABEL_KEY: Record<string, TranslationKey> = {
  ec_full: "basisEcFull",
  kan_full: "basisKanFull",
  kan_fee: "basisKanFee",
  mitsumori: "basisMitsumori",
  country: "basisCountry",
  operation_export: "basisOpExport",
  operation_import: "basisOpImport",
};

const APP_LABEL: Record<string, string> = {
  air: "Air",
  sea: "SEA",
  ec: "EC",
};

function fmtMoney(n: number): string {
  const rounded = Math.round(n);
  return `¥${rounded.toLocaleString("en-US")}`;
}

export function CaseDetail({ report, teams, groupName, currency }: Props) {
  const { t, lang } = useLang();
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
        {t("noAllocation", { team: teamName(lang, groupName) })}
      </div>
    );
  }

  const showTeamColumn = teams.length > 1;

  return (
    <div className="mx-6 my-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <table className="w-full text-xs">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">{t("colCaseNumber")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("colCategory")}</th>
            {showTeamColumn && (
              <th className="px-3 py-2 text-left font-medium">{t("colOwnerTeam")}</th>
            )}
            <th className="px-3 py-2 text-left font-medium">{t("colCustomer")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("colCountryCode")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("colAllocationBasis")}</th>
            <th className="px-3 py-2 text-right font-medium">{t("colShareAmount")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr key={`${row.ca.case.recordId}-${row.team}-${idx}`} className="hover:bg-white">
              <td className="px-3 py-2 font-mono">{row.ca.case.caseNumber || "-"}</td>
              <td className="px-3 py-2">{APP_LABEL[row.ca.case.appType]}</td>
              {showTeamColumn && <td className="px-3 py-2 font-medium">{teamName(lang, row.team)}</td>}
              <td className="px-3 py-2">{row.ca.case.customerName || "-"}</td>
              <td className="px-3 py-2">{row.ca.case.customerCountry || "-"}</td>
              <td className="px-3 py-2 text-slate-500">
                {row.bases.map((b) => t(BASIS_LABEL_KEY[b] ?? "basisMitsumori")).join(" + ")}
              </td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold">
                {fmtMoney(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
