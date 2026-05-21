"use client";

import { useCallback, useEffect, useState } from "react";
import type { Currency, MonthlyReport } from "@/lib/types";
import { MonthPicker } from "./components/MonthPicker";
import { CurrencyToggle } from "./components/CurrencyToggle";
import { SummaryTable } from "./components/SummaryTable";
import { CaseDetail } from "./components/CaseDetail";
import { ActionBar } from "./components/ActionBar";
import { CaseSearch } from "./components/CaseSearch";

const NOW = new Date();
const DEFAULT_YEAR = NOW.getFullYear();
const DEFAULT_MONTH = Math.max(NOW.getMonth() + 1, 4);

export default function HomePage() {
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

  const handleToggleTeam = (team: string) => {
    setExpandedTeam((prev) => (prev === team ? null : team));
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">月度利润自动分配</h1>
        <p className="mt-1 text-sm text-slate-500">
          Air / SEA / EC 三类案件，按业务规则自动计算各小组分得的利润
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-4">
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
          title="重新从 Kintone 拉取数据"
        >
          <span className={loading ? "animate-spin inline-block" : ""}>🔄</span>
          {loading ? "刷新中…" : "刷新数据"}
        </button>
        {report?.dataFetchedAt && (
          <span className="text-xs text-slate-500">
            数据更新于 {new Date(report.dataFetchedAt).toLocaleString("zh-CN")}
            {report.fromCache && <span className="ml-1 text-slate-400">(缓存)</span>}
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
          数据加载中…
        </div>
      )}

      {!loading && report && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-4">
            <StatCard label="案件数" value={String(report.totalCases)} />
            <StatCard
              label={`本月利润合计（${currency === "jpy" ? "JPY" : "CNY"}）`}
              value={`¥${Math.round(
                currency === "jpy" ? report.totalProfitJpy : report.totalProfitCny
              ).toLocaleString("en-US")}`}
            />
            <StatCard label="参与分利小组数" value={String(report.summaries.length)} />
          </div>

          <div className="mb-4">
            <CaseSearch report={report} currency={currency} />
          </div>

          <div className="space-y-0">
            <SummaryTable
              report={report}
              currency={currency}
              expandedTeam={expandedTeam}
              onToggleTeam={handleToggleTeam}
            />
            {expandedTeam && (
              <CaseDetail report={report} team={expandedTeam} currency={currency} />
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
    </div>
  );
}
