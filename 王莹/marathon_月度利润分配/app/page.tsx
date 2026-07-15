"use client";

import { useCallback, useEffect, useState } from "react";
import type { Currency, MonthlyReport } from "@/lib/types";
import { MonthPicker } from "./components/MonthPicker";
import { CurrencyToggle } from "./components/CurrencyToggle";
import { SummaryTable } from "./components/SummaryTable";
import { CaseDetail } from "./components/CaseDetail";
import { ActionBar } from "./components/ActionBar";
import { CaseSearch } from "./components/CaseSearch";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useLang } from "./components/LanguageProvider";

const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = Math.max(NOW.getMonth() + 1, 4);

export default function HomePage() {
  const { t, lang } = useLang();
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [currency, setCurrency] = useState<Currency>("jpy");
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const load = useCallback(
    async (y: number, m: number, forceRefresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/cases?year=${y}&month=${m}${forceRefresh ? "&refresh=1" : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "拉取失败");
        setReport(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setReport(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    load(year, month);
  }, [year, month, load]);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setExpandedTeam(null);
  };

  const handleRefresh = () => {
    setExpandedTeam(null);
    load(year, month, true);
  };

  const handleToggleDetail = (key: string) => {
    setExpandedTeam((prev) => (prev === key ? null : key));
  };

  const detailTarget = (() => {
    if (!expandedTeam || !report) return null;
    if (expandedTeam.startsWith("group:")) {
      const name = expandedTeam.slice("group:".length);
      const g = report.groupedSummaries.find((x) => x.name === name);
      if (!g) return null;
      return { teams: g.childTeams, label: g.name };
    }
    if (expandedTeam.startsWith("team:")) {
      const team = expandedTeam.slice("team:".length);
      return { teams: [team], label: team };
    }
    return null;
  })();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
      <header className="mb-4 sm:mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">{t("appTitle")}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">{t("appDescription")}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="mb-4 sm:mb-6 flex flex-wrap items-center gap-2 sm:gap-4">
        <MonthPicker
          year={year}
          month={month}
          onChange={handleMonthChange}
          disabled={loading}
        />
        <CurrencyToggle value={currency} onChange={setCurrency} />
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t("refreshTooltip")}
        >
          <span className={loading ? "animate-spin inline-block" : ""}>🔄</span>
          <span className="hidden sm:inline">{loading ? t("refreshing") : t("refresh")}</span>
        </button>
        {report?.dataFetchedAt && (
          <span className="text-xs text-slate-500 basis-full sm:basis-auto order-last sm:order-none">
            {t("dataUpdatedAt")} {new Date(report.dataFetchedAt).toLocaleString(lang === "ja" ? "ja-JP" : "zh-CN")}
            {report.fromCache && <span className="ml-1 text-slate-400">({t("cache")})</span>}
          </span>
        )}
        <div className="ml-auto">
          <ActionBar year={year} month={month} disabled={loading || !report} />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          ❌ {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          {t("loading")}
        </div>
      )}

      {!loading && report && (
        <>
          <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label={t("statTotalCases")} value={String(report.totalCases)} />
            <StatCard
              label={`${t("statTotalProfit")}（${currency === "jpy" ? "JPY" : "CNY"}）`}
              value={`¥${report.groupedSummaries.reduce((sum, g) => {
                const jpy = currency === "jpy";
                return (
                  sum +
                  Math.round(jpy ? g.mitsumoriJpy : g.mitsumoriCny) +
                  Math.round(jpy ? g.countryJpy : g.countryCny) +
                  Math.round(jpy ? g.opExportJpy : g.opExportCny) +
                  Math.round(jpy ? g.opImportJpy : g.opImportCny) +
                  Math.round(jpy ? g.kanFeeJpy : g.kanFeeCny)
                );
              }, 0).toLocaleString("en-US")}`}
            />
            <StatCard
              label={t("statTeamCount")}
              value={String(report.groupedSummaries.length)}
              className="hidden sm:block"
            />
          </div>

          <div className="mb-4">
            <CaseSearch report={report} currency={currency} />
          </div>

          <div className="space-y-0">
            <SummaryTable
              report={report}
              currency={currency}
              expandedTeam={expandedTeam}
              onToggleDetail={handleToggleDetail}
            />
            {detailTarget && (
              <CaseDetail
                report={report}
                teams={detailTarget.teams}
                groupName={detailTarget.label}
                currency={currency}
              />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl sm:text-2xl font-bold tabular-nums text-slate-900 break-all">
        {value}
      </div>
    </div>
  );
}
