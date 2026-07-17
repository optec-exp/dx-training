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
          {currency === "cny" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm text-amber-800 flex items-center gap-2">
              <span>ℹ️</span>
              <span>{t("achievementCnyNotice")}</span>
            </div>
          )}

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

          {currency === "jpy" && <AchievementBar report={report} />}

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

function AchievementBar({ report }: { report: MonthlyReport }) {
  const { t } = useLang();

  const actualJpy = report.groupedSummaries.reduce(
    (sum, g) =>
      sum +
      Math.round(g.mitsumoriJpy) +
      Math.round(g.countryJpy) +
      Math.round(g.opExportJpy) +
      Math.round(g.opImportJpy) +
      Math.round(g.kanFeeJpy),
    0
  );
  const targetJpy = report.targets?.companyJpy ?? 0;
  const configured = report.targets?.configured ?? false;

  if (!configured || targetJpy <= 0) {
    return (
      <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-3 shadow-sm flex items-center gap-3 text-sm text-slate-500">
        <span>🎯 {t("statAchievement")}</span>
        <span className="text-slate-400">— {t("achievementNotConfigured")}</span>
      </div>
    );
  }

  const pct = (actualJpy / targetJpy) * 100;
  const diff = actualJpy - targetJpy;
  const isOver = pct > 100.5;
  const isPrecise = !isOver && pct >= 99.5;

  // 超额：金色背景 + 目标线 + 溢出段（方案 5 的标志性视觉）
  if (isOver) {
    // 达成部分占容器：100/pct；溢出部分：1 - 100/pct
    const donePct = (100 / pct) * 100;
    const overPct = 100 - donePct;
    return (
      <div
        className="mb-4 relative overflow-hidden rounded-xl border border-amber-300 px-4 sm:px-5 py-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
        }}
      >
        <span className="absolute top-2 right-3 text-xl opacity-40 pointer-events-none">✨</span>
        <div
          className="absolute -top-16 -right-16 w-52 h-52 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(251,191,36,0.35) 0%, transparent 70%)",
          }}
        />
        <div className="relative grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] sm:gap-6 items-center gap-3">
          <div>
            <div className="text-xs font-semibold text-amber-800">
              🎯 {t("statAchievement")}
            </div>
            <div className="mt-0.5 text-2xl sm:text-3xl font-bold tabular-nums leading-none text-amber-700">
              🏆 {pct.toFixed(0)}%
            </div>
          </div>

          <div className="relative h-3 rounded-full bg-white shadow-inner">
            <div
              className="absolute left-0 top-0 h-full rounded-l-full"
              style={{
                width: `${donePct}%`,
                background: "linear-gradient(90deg, #f59e0b 0%, #fcd34d 100%)",
              }}
            />
            <div
              className="absolute top-0 h-full rounded-r-full"
              style={{
                left: `${donePct}%`,
                width: `${overPct}%`,
                background: "linear-gradient(90deg, #d97706 0%, #fbbf24 100%)",
                boxShadow: "0 0 10px rgba(245,158,11,0.6)",
              }}
            />
            <div
              className="absolute -top-1 h-[calc(100%+8px)] w-0.5 rounded-sm bg-slate-900 z-10"
              style={{ left: `${donePct}%` }}
              title={`${t("lblTarget")} 100%`}
            />
          </div>

          <div className="text-left sm:text-right tabular-nums">
            <div className="text-sm font-semibold text-amber-800">
              ¥{Math.round(actualJpy).toLocaleString("en-US")}
            </div>
            <div className="text-xs text-slate-600">
              {t("lblTarget")} ¥{Math.round(targetJpy).toLocaleString("en-US")}
              <span className="ml-1.5 text-amber-700 font-semibold">
                +¥{Math.round(diff).toLocaleString("en-US")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 非超额：白背景，按 5 档分色
  let barBg: string;
  let textCls: string;
  if (isPrecise) {
    barBg = "linear-gradient(90deg, #10b981 0%, #059669 100%)";
    textCls = "text-emerald-700";
  } else if (pct >= 80) {
    barBg = "linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)";
    textCls = "text-sky-700";
  } else if (pct >= 60) {
    barBg = "linear-gradient(90deg, #f97316 0%, #fb923c 100%)";
    textCls = "text-orange-700";
  } else {
    barBg = "linear-gradient(90deg, #f43f5e 0%, #fb7185 100%)";
    textCls = "text-rose-700";
  }
  const barWidth = Math.min(100, Math.max(0, pct));
  const diffPrefix = diff >= 0 ? "+" : "−";
  const diffAbs = Math.abs(diff);
  const diffCls =
    diff > 0
      ? "text-emerald-600"
      : diff < 0
      ? "text-rose-600"
      : "text-emerald-700 font-semibold";

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-4 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] sm:gap-6 items-center gap-3">
        <div>
          <div className="text-xs text-slate-500">🎯 {t("statAchievement")}</div>
          <div
            className={`mt-0.5 text-2xl sm:text-3xl font-bold tabular-nums leading-none inline-flex items-center gap-2 ${textCls}`}
          >
            <span>{pct.toFixed(0)}%</span>
            {isPrecise && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-500">
                {t("achvBadgePrecise")}
              </span>
            )}
          </div>
        </div>

        <div className="h-2 sm:h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${barWidth}%`, background: barBg }}
          />
        </div>

        <div className="text-left sm:text-right tabular-nums">
          <div className="text-sm font-semibold text-slate-800">
            ¥{Math.round(actualJpy).toLocaleString("en-US")}
          </div>
          <div className="text-xs text-slate-500">
            {t("lblTarget")} ¥{Math.round(targetJpy).toLocaleString("en-US")}
            {diff === 0 ? (
              <span className="ml-1.5 text-emerald-700 font-semibold">±¥0</span>
            ) : (
              <span className={`ml-1.5 ${diffCls}`}>
                {diffPrefix}¥{Math.round(diffAbs).toLocaleString("en-US")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
