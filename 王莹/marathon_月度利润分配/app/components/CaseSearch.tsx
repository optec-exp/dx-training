"use client";

import { useEffect, useMemo, useState } from "react";
import type { CaseAllocation, Currency, MonthlyReport } from "@/lib/types";
import { useLang } from "./LanguageProvider";
import { teamName, type TranslationKey } from "@/lib/i18n";

interface Props {
  report: MonthlyReport;
  currency: Currency;
}

const MAX_RESULTS = 10;

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

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function CaseSearch({ report, currency }: Props) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  const { matched, truncated } = useMemo<{
    matched: CaseAllocation[];
    truncated: number;
  }>(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return { matched: [], truncated: 0 };

    const exact = report.caseAllocations.find(
      (ca) => ca.case.caseNumber.toLowerCase() === q
    );
    if (exact) return { matched: [exact], truncated: 0 };

    const all = report.caseAllocations.filter((ca) => {
      const c = ca.case;
      return (
        c.caseNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
      );
    });
    return {
      matched: all.slice(0, MAX_RESULTS),
      truncated: Math.max(0, all.length - MAX_RESULTS),
    };
  }, [debouncedQuery, report]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 shrink-0">
          🔍 {t("searchCase")}
        </label>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs text-slate-500 hover:text-slate-700 shrink-0"
          >
            {t("btnClear")}
          </button>
        )}
      </div>

      {debouncedQuery && (
        <div className="mt-4">
          {matched.length === 0 ? (
            <div className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              {t("noMatched")}
            </div>
          ) : (
            <div className="text-xs text-slate-500 mb-2">
              {t("foundMatched", { count: matched.length })}
              {truncated > 0 && (
                <span className="ml-2 text-amber-600">
                  {t("truncated", { count: truncated })}
                </span>
              )}
            </div>
          )}

          <div className="space-y-3">
            {matched.map((ca) => (
              <CaseCard key={ca.case.recordId} ca={ca} currency={currency} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CaseCard({ ca, currency }: { ca: CaseAllocation; currency: Currency }) {
  const { t, lang } = useLang();
  const c = ca.case;
  const gross = currency === "jpy" ? c.grossProfitJpy : c.grossProfitCny;
  const kanFee = currency === "jpy" ? c.kanFeeJpy : c.kanFeeCny;
  const allocSum = ca.allocations.reduce(
    (s, a) => s + (currency === "jpy" ? a.jpy : a.cny),
    0
  );
  const diff = gross - allocSum;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 px-4 py-3 text-sm">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono font-semibold text-slate-900 text-base">
              {c.caseNumber || "-"}
            </span>
            <span className="inline-block rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
              {APP_LABEL[c.appType]}
            </span>
            <span className="text-xs text-slate-500">{t("colCountryCode")} {c.customerCountry || "-"}</span>
          </div>
          <div className="mt-1 text-xs text-slate-600">{c.customerName || "-"}</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-right">
            <div className="text-slate-500">{t("lblExport")}</div>
            <div className="font-medium text-slate-800">{c.exportTeam || "-"}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">{t("lblImport")}</div>
            <div className="font-medium text-slate-800">{c.importTeam || "-"}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">{t("lblMitsumori")}</div>
            <div className="font-medium text-slate-800">{c.mitsumoriTeam || "-"}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-white text-sm">
        <div className="px-4 py-2 text-center">
          <div className="text-xs text-slate-500">{t("lblGrossProfit")}</div>
          <div className="font-bold tabular-nums text-slate-900">¥{fmt(gross)}</div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-xs text-slate-500">{t("lblKanFeeTotal")}</div>
          <div className="font-bold tabular-nums text-slate-900">¥{fmt(kanFee)}</div>
        </div>
        <div className="px-4 py-2 text-center">
          <div className="text-xs text-slate-500">{t("lblAllocationTotal")}</div>
          <div className="font-bold tabular-nums text-slate-900">¥{fmt(allocSum)}</div>
          {Math.abs(diff) > 0.5 && (
            <div className="text-[10px] text-rose-600 mt-0.5">Δ ¥{fmt(diff)}</div>
          )}
        </div>
      </div>

      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium w-1/3">{t("colAllocationBasis")}</th>
            <th className="px-3 py-2 text-left font-medium">{t("colTeam")}</th>
            <th className="px-3 py-2 text-right font-medium">{t("colShareAmount")}</th>
            <th className="px-3 py-2 text-right font-medium">{t("colRatio")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ca.allocations.map((a, idx) => {
            const amount = currency === "jpy" ? a.jpy : a.cny;
            const pct = gross === 0 ? 0 : (amount / gross) * 100;
            return (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-600">
                  {t(BASIS_LABEL_KEY[a.basis] ?? "basisMitsumori")}
                </td>
                <td className="px-3 py-2 font-medium text-slate-800">{teamName(lang, a.team)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">
                  ¥{fmt(amount)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                  {pct.toFixed(1)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
