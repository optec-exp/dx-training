"use client";

import type {
  Currency,
  GroupedSummary,
  MonthlyReport,
  TeamSummary,
} from "@/lib/types";
import { useLang } from "./LanguageProvider";

interface Props {
  report: MonthlyReport;
  currency: Currency;
  expandedTeam: string | null;
  onToggleDetail: (key: string) => void;
}

interface AchievementInfo {
  pct: number;
  targetJpy: number;
  actualJpy: number;
  color: "green" | "blue" | "orange" | "red";
}

function achievementInfoFor(
  actualJpy: number,
  targetJpy: number
): AchievementInfo | null {
  if (!targetJpy || targetJpy <= 0) return null;
  const pct = (actualJpy / targetJpy) * 100;
  let color: AchievementInfo["color"] = "red";
  if (pct >= 100) color = "green";
  else if (pct >= 80) color = "blue";
  else if (pct >= 60) color = "orange";
  return { pct, targetJpy, actualJpy, color };
}

function achievementColorClasses(color: AchievementInfo["color"]) {
  switch (color) {
    case "green":
      return { bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
    case "blue":
      return { bar: "bg-sky-500", text: "text-sky-700", bg: "bg-sky-50" };
    case "orange":
      return { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" };
    case "red":
      return { bar: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" };
  }
}

function AchievementCell({
  info,
  compact = false,
  tooltip,
}: {
  info: AchievementInfo | null;
  compact?: boolean;
  tooltip?: string;
}) {
  if (!info) {
    return <span className="text-slate-400">-</span>;
  }
  const cls = achievementColorClasses(info.color);
  const barWidth = Math.min(100, Math.max(0, info.pct));
  return (
    <div className="flex items-center gap-2" title={tooltip}>
      <div
        className={`h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0 ${
          compact ? "w-14" : "w-20"
        }`}
      >
        <div className={`h-full ${cls.bar}`} style={{ width: `${barWidth}%` }} />
      </div>
      <span className={`tabular-nums text-xs font-semibold ${cls.text} shrink-0`}>
        {info.pct.toFixed(0)}%
      </span>
    </div>
  );
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
  const { t } = useLang();
  const grandTotal = report.groupedSummaries.reduce(
    (sum, g) => sum + displayTotal(g, currency),
    0
  );
  const currencyLabel = currency === "jpy" ? "JPY" : "CNY";
  const showAchievement = currency === "jpy" && report.targets?.configured;
  const grandJpyForAchievement = report.groupedSummaries.reduce(
    (sum, g) => sum + displayTotal(g, "jpy"),
    0
  );
  const groupJpy = (name: string) => {
    const g = report.groupedSummaries.find((x) => x.name === name);
    if (!g) return 0;
    return displayTotal(g, "jpy");
  };
  const targetFor = (name: string): number | undefined =>
    report.targets?.teamsJpy?.[name];
  const DIM_LABELS: Record<DimKey, string> = {
    mitsumori: `${t("colMitsumori")} 20%`,
    country: `${t("colCountry")} 35%`,
    opExport: `${t("colOpExport")} 27%`,
    opImport: `${t("colOpImport")} 18%`,
    kanFee: t("colKanFee"),
  };

  return (
    <>
      {/* 电脑端：表格布局（>= 1024px） */}
      <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">{t("colTeam")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("colCaseCount")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("colMitsumori")} 20%</th>
              <th className="px-4 py-3 text-right font-medium">{t("colCountry")} 35%</th>
              <th className="px-4 py-3 text-right font-medium">{t("colOpExport")} 27%</th>
              <th className="px-4 py-3 text-right font-medium">{t("colOpImport")} 18%</th>
              <th className="px-4 py-3 text-right font-medium">{t("colKanFee")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("colTotal")}（{currencyLabel}）</th>
              {showAchievement && (
                <th className="px-4 py-3 text-center font-medium">{t("colAchievement")}</th>
              )}
              <th className="px-4 py-3 text-right font-medium">{t("colRatio")}</th>
              <th className="px-4 py-3 text-right font-medium w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.groupedSummaries.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={showAchievement ? 11 : 10}>
                  {t("noData")}
                </td>
              </tr>
            )}
            {report.groupedSummaries.map((g) => {
              const amount = displayTotal(g, currency);
              const pct = grandTotal === 0 ? 0 : amount / grandTotal;
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
                  {showAchievement && (
                    <td className="px-4 py-3">
                      {(() => {
                        const jpyAmount = groupJpy(g.name);
                        const target = targetFor(g.name);
                        const info = target ? achievementInfoFor(jpyAmount, target) : null;
                        const tooltip = target
                          ? `${t("lblTarget")} ¥${Math.round(target).toLocaleString("en-US")} · ${t("lblDiff")} ¥${Math.round(jpyAmount - target).toLocaleString("en-US")}`
                          : t("achievementNoData");
                        return (
                          <div className="flex justify-center">
                            <AchievementCell info={info} tooltip={tooltip} />
                          </div>
                        );
                      })()}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {fmtPct(pct)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onToggleDetail(detailKey)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      {isDetailOpen ? t("btnCollapse") : t("btnDetail")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {report.groupedSummaries.length > 0 && (
            <tfoot className="bg-slate-50 font-medium">
              <tr>
                <td className="px-4 py-3 text-slate-700">{t("colTotal")}</td>
                <td className="px-4 py-3 text-right tabular-nums">{report.totalCases}</td>
                {DIM_KEYS.map((k) => (
                  <td key={k} className="px-4 py-3 text-right tabular-nums">
                    {dimCell(
                      report.groupedSummaries.reduce((sum, g) => sum + dimAmount(g, k, currency), 0)
                    )}
                  </td>
                ))}
                <td className="px-4 py-3 text-right tabular-nums">{fmtMoney(grandTotal)}</td>
                {showAchievement && (
                  <td className="px-4 py-3">
                    {(() => {
                      const target = report.targets?.companyJpy ?? 0;
                      const info = target ? achievementInfoFor(grandJpyForAchievement, target) : null;
                      const tooltip = target
                        ? `${t("lblTarget")} ¥${Math.round(target).toLocaleString("en-US")} · ${t("lblDiff")} ¥${Math.round(grandJpyForAchievement - target).toLocaleString("en-US")}`
                        : t("achievementNoData");
                      return (
                        <div className="flex justify-center">
                          <AchievementCell info={info} tooltip={tooltip} />
                        </div>
                      );
                    })()}
                  </td>
                )}
                <td className="px-4 py-3 text-right tabular-nums">100.0%</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 手机端：卡片列表（< 1024px） */}
      <div className="lg:hidden space-y-3">
        {report.groupedSummaries.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-400">
            {t("noData")}
          </div>
        )}
        {report.groupedSummaries.map((g) => {
          const amount = displayTotal(g, currency);
          const pct = grandTotal === 0 ? 0 : amount / grandTotal;
          const detailKey = `group:${g.name}`;
          const isDetailOpen = expandedTeam === detailKey;
          return (
            <div
              key={g.name}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex items-baseline justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-slate-800">{g.name}</span>
                  <span className="text-xs text-slate-500">{g.caseCount} 件</span>
                </div>
                <div className="text-right">
                  <div className="font-bold tabular-nums text-slate-900">{fmtMoney(amount)}</div>
                  <div className="text-xs text-slate-500">{fmtPct(pct)}</div>
                </div>
              </div>
              {showAchievement && (() => {
                const jpyAmount = groupJpy(g.name);
                const target = targetFor(g.name);
                const info = target ? achievementInfoFor(jpyAmount, target) : null;
                if (!info) return null;
                const cls = achievementColorClasses(info.color);
                return (
                  <div className={`px-4 py-2 border-b border-slate-100 ${cls.bg}`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600">
                        🎯 {t("lblTarget")} ¥{Math.round(target ?? 0).toLocaleString("en-US")}
                      </span>
                      <span className={`font-bold ${cls.text}`}>{info.pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/70 overflow-hidden">
                      <div
                        className={`h-full ${cls.bar}`}
                        style={{ width: `${Math.min(100, Math.max(0, info.pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
              <div className="divide-y divide-slate-100 text-sm">
                {DIM_KEYS.map((k) => {
                  const v = dimAmount(g, k, currency);
                  return (
                    <div key={k} className="flex items-center justify-between px-4 py-2">
                      <span className="text-slate-500">{DIM_LABELS[k]}</span>
                      <span className="tabular-nums text-slate-700">{dimCell(v)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onToggleDetail(detailKey)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  {isDetailOpen ? t("btnCollapseDetail") : t("btnViewDetail")}
                </button>
              </div>
            </div>
          );
        })}

        {report.groupedSummaries.length > 0 && (
          <div className="rounded-xl border border-slate-300 bg-slate-100 px-4 py-3">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-800">{t("colTotal")}</span>
                <span className="text-xs text-slate-500">{report.totalCases} 件</span>
              </div>
              <div className="text-right">
                <div className="font-bold tabular-nums text-slate-900">{fmtMoney(grandTotal)}</div>
                <div className="text-xs text-slate-500">100%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
