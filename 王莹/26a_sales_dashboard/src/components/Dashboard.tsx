"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, ComposedChart,
  Treemap, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  SalesRecord, SgaRecord, ScopeRow,
  aggregateSalesByMonth, aggregateSgaByMonth,
  buildMonthlyTrend, buildCustomerRanking, buildSgaBreakdown,
  buildScopeBreakdown, formatJPY,
} from "@/lib/aggregate";

/* ─── 色定数 ─── */
const C = {
  sales:       "#3b82f6",
  grossProfit: "#10b981",
  sga:         "#f59e0b",
  netProfit:   "#8b5cf6",
  case:        "#64748b",
};
const SGA_PALETTE = [
  "#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f",
  "#edc948","#b07aa1","#ff9da7","#9c755f","#bab0ac",
  "#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f","#edc948",
];

/* ─── ユーティリティ ─── */
function fM(v: number) {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + "K";
  return String(v);
}
function calcChange(c: number, p: number) {
  return p === 0 ? 0 : Math.round(((c - p) / Math.abs(p)) * 1000) / 10;
}
const tooltipStyle = {
  borderRadius: 12, border: "none",
  boxShadow: "0 8px 32px rgba(0,0,0,0.13)", fontSize: 12,
};
const axisProps = { axisLine: false, tickLine: false };

/* ─── KPI カード ─── */
const KPI_CONFIG = [
  { key: "sales",          label: "销售额",   icon: "💰", grad: "from-blue-500 to-blue-600" },
  { key: "grossProfit",    label: "粗利润",   icon: "📈", grad: "from-emerald-500 to-teal-500" },
  { key: "grossMarginPct", label: "粗利率",   icon: "📊", grad: "from-green-400 to-emerald-500", pct: true },
  { key: "sga",            label: "SGA费用",  icon: "🏢", grad: "from-amber-400 to-orange-500" },
  { key: "netProfit",      label: "净利润",   icon: "✨", grad: "from-violet-500 to-purple-600" },
  { key: "caseCount",      label: "案件数",   icon: "📦", grad: "from-slate-400 to-slate-500", count: true },
];

type KpiData = {
  sales: number; grossProfit: number; grossMarginPct: number;
  sga: number; netProfit: number; caseCount: number;
  salesChange?: number; grossProfitChange?: number; grossMarginChange?: number;
  sgaChange?: number; netProfitChange?: number; caseChange?: number;
  ytdSales?: number; ytdGrossProfit?: number; ytdNetProfit?: number; ytdSga?: number; ytdCaseCount?: number;
};

function KpiCard({ cfg, kpi }: { cfg: typeof KPI_CONFIG[0]; kpi: KpiData }) {
  const raw   = kpi[cfg.key as keyof KpiData] as number;
  const chKey = (cfg.key + "Change") as keyof KpiData;
  const ch    = kpi[chKey] as number | undefined;
  const up    = (ch ?? 0) >= 0;

  const valueStr = cfg.pct   ? raw + "%"
                 : cfg.count ? raw + " 件"
                 : formatJPY(raw);

  const subStr = cfg.key === "grossMarginPct" && kpi.grossMarginChange !== undefined
    ? `较上月 ${kpi.grossMarginChange > 0 ? "+" : ""}${kpi.grossMarginChange}pt`
    : ch !== undefined ? "较上月" : "";

  // YTD secondary line
  const ytdKey = ("ytd" + cfg.key.charAt(0).toUpperCase() + cfg.key.slice(1)) as keyof KpiData;
  const ytdVal = kpi[ytdKey] as number | undefined;

  return (
    <div className="rounded-2xl bg-white shadow-md border border-slate-100 overflow-hidden flex flex-col min-w-0 print-card">
      <div className={`h-1 w-full bg-gradient-to-r ${cfg.grad}`} />
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{cfg.label}</span>
          <span className="text-lg">{cfg.icon}</span>
        </div>
        <div className="text-lg font-extrabold text-slate-800 leading-tight break-all">{valueStr}</div>
        {ytdVal !== undefined && !cfg.pct && (
          <div className="text-xs text-slate-400">YTD: <span className="font-semibold text-slate-600">{cfg.count ? ytdVal + " 件" : formatJPY(ytdVal)}</span></div>
        )}
        <div className="flex items-center gap-2 text-xs mt-auto">
          {ch !== undefined && (
            <span className={`font-bold px-2 py-0.5 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
              {up ? "▲" : "▼"} {Math.abs(ch)}%
            </span>
          )}
          {subStr && <span className="text-slate-400">{subStr}</span>}
        </div>
      </div>
    </div>
  );
}

/* ─── Treemap カスタムセル ─── */
type TmProps = { x?: number; y?: number; width?: number; height?: number; name?: string; value?: number; fill?: string };
function TmCell({ x=0, y=0, width=0, height=0, name="", value=0, fill="#ccc" }: TmProps) {
  const showName  = width > 55 && height > 30;
  const showValue = width > 65 && height > 48;
  return (
    <g>
      <rect x={x+1} y={y+1} width={width-2} height={height-2} fill={fill} rx={5} opacity={0.93}/>
      {showName  && <text x={x+width/2} y={y+height/2-(showValue?9:0)} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.min(12,width/7)} fontWeight={700}>{name.length>10?name.slice(0,10)+"…":name}</text>}
      {showValue && <text x={x+width/2} y={y+height/2+11} textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.82)" fontSize={10}>{fM(value)}</text>}
    </g>
  );
}

/* ─── Business Scope テーブル ─── */
function ScopePanel({ data }: { data: ScopeRow[] }) {
  if (!data.length) return <p className="text-sm text-gray-400 py-6 text-center">暂无数据</p>;
  const maxCount  = Math.max(...data.map(r => r.caseCount), 1);
  const maxProfit = Math.max(...data.map(r => r.grossProfit), 1);
  return (
    <div>
      <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-slate-50 rounded-xl mb-1 text-xs font-bold text-slate-400 uppercase tracking-wide">
        <div className="col-span-4">业务类型</div>
        <div className="col-span-2 text-right">销售额</div>
        <div className="col-span-2 text-right">粗利润</div>
        <div className="col-span-2 text-center">利润率</div>
        <div className="col-span-2 text-right">案件数</div>
      </div>
      <div className="divide-y divide-slate-50">
        {data.map(row => {
          const mc = row.grossMarginPct >= 20
            ? { bg:"bg-emerald-50", text:"text-emerald-600" }
            : row.grossMarginPct >= 10
            ? { bg:"bg-amber-50",   text:"text-amber-600" }
            : { bg:"bg-red-50",     text:"text-red-500" };
          return (
            <div key={row.scope} className="grid grid-cols-12 gap-1 px-3 py-2.5 items-center hover:bg-blue-50/50 rounded-xl transition-colors">
              <div className="col-span-4 text-sm font-semibold text-slate-700 truncate" title={row.scope}>{row.scope||"未設定"}</div>
              <div className="col-span-2 text-right text-sm text-slate-500">{fM(row.sales)}</div>
              <div className="col-span-2 flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold text-emerald-600">{fM(row.grossProfit)}</span>
                <div className="w-full bg-slate-100 rounded-full h-1">
                  <div className="h-1 rounded-full bg-emerald-400" style={{ width:`${(row.grossProfit/maxProfit)*100}%` }}/>
                </div>
              </div>
              <div className="col-span-2 flex justify-center">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${mc.bg} ${mc.text}`}>{row.grossMarginPct}%</span>
              </div>
              <div className="col-span-2 flex flex-col items-end gap-0.5">
                <span className="text-sm text-slate-500">{row.caseCount}件</span>
                <div className="w-full bg-slate-100 rounded-full h-1">
                  <div className="h-1 rounded-full bg-blue-400" style={{ width:`${(row.caseCount/maxCount)*100}%` }}/>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-3 pt-2 border-t border-slate-100 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-100 border border-emerald-400 inline-block"/>≥20%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-100 border border-amber-400 inline-block"/>10–20%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-100 border border-red-400 inline-block"/>&lt;10%</span>
      </div>
    </div>
  );
}

/* ─── セクションタイトル ─── */
function SecTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-1 h-5 rounded-full bg-blue-500" />
      <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{children}</h2>
    </div>
  );
}

/* ─── カードラッパー ─── */
function Card({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-md border border-slate-100 p-5 print-card ${className}`}>{children}</div>;
}

/* ─── CSV エクスポート ─── */
function exportCsv(trend: ReturnType<typeof buildMonthlyTrend>) {
  const header = ["月份","売上","粗利益","粗利益率%","SGA","净利润","案件数"];
  const rows = trend.map(r => [
    r.month, r.sales, r.grossProfit, r.grossMarginPct, r.sga, r.netProfit, r.caseCount,
  ]);
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "sales_trend.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* ═══════════════════════════════════════════════ */
export default function Dashboard() {
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [allSalesRecords, setAllSalesRecords] = useState<SalesRecord[]>([]);
  const [allSgaRecords,   setAllSgaRecords]   = useState<SgaRecord[]>([]);
  const [validCount,      setValidCount]      = useState(0);
  const [totalCount,      setTotalCount]      = useState(0);
  const [selectedYear,    setSelectedYear]    = useState("2026");
  const [selectedMonth,   setSelectedMonth]   = useState("");
  const [trendTab,        setTrendTab]        = useState<"amount"|"rate">("amount");
  const [updatedAt,       setUpdatedAt]       = useState<Date|null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [sr, gr] = await Promise.all([fetch("/api/sales"), fetch("/api/sga")]);
        const sd = await sr.json(); const gd = await gr.json();
        if (sd.error) throw new Error(sd.error);
        if (gd.error) throw new Error(gd.error);
        setAllSalesRecords(sd.records); setAllSgaRecords(gd.records);
        setValidCount(sd.valid ?? sd.records.length);
        setTotalCount(sd.total ?? sd.records.length);
        setUpdatedAt(new Date());
      } catch(e) { setError(String(e)); } finally { setLoading(false); }
    })();
  }, []);

  /* 年度集計 */
  const { trend, yearlyProfitRanking, sgaBreakdown, scopeBreakdown } = useMemo(() => {
    const fs = allSalesRecords.filter(r => r.請求日?.value?.startsWith(selectedYear));
    const fg = allSgaRecords.filter(r => r.取引日?.value?.startsWith(selectedYear));
    const sm = aggregateSalesByMonth(fs); const gm = aggregateSgaByMonth(fg);
    const td = buildMonthlyTrend(sm, gm);
    const rk = buildCustomerRanking(fs).sort((a,b) => b.grossProfit - a.grossProfit);
    return {
      trend: td,
      yearlyProfitRanking: rk,
      sgaBreakdown: buildSgaBreakdown(gm),
      scopeBreakdown: buildScopeBreakdown(fs),
    };
  }, [allSalesRecords, allSgaRecords, selectedYear]);

  /* デフォルト月 */
  const latestSalesMonth = useMemo(() => {
    const w = trend.filter(r => r.sales > 0);
    return w.length ? w[w.length-1].month : trend[trend.length-1]?.month ?? "";
  }, [trend]);
  const activeMonth = selectedMonth || latestSalesMonth;

  /* 月度データ */
  const monthlyProfitRanking = useMemo(() =>
    buildCustomerRanking(allSalesRecords.filter(r => r.請求日?.value?.startsWith(activeMonth)))
      .sort((a,b) => b.grossProfit - a.grossProfit),
    [allSalesRecords, activeMonth]);

  const monthlyScope = useMemo(() =>
    buildScopeBreakdown(allSalesRecords.filter(r => r.請求日?.value?.startsWith(activeMonth))),
    [allSalesRecords, activeMonth]);

  /* 空月份警告 */
  const zeroSalesMonths = useMemo(() =>
    trend.filter(r => r.sales === 0 && r.sga > 0).map(r => r.month),
    [trend]);

  /* 粗利益率連続下降警告 */
  const marginDeclineWarning = useMemo(() => {
    const salesMonths = trend.filter(r => r.sales > 0);
    if (salesMonths.length < 3) return null;
    let streak = 1;
    for (let i = salesMonths.length - 1; i >= 1; i--) {
      if (salesMonths[i].grossMarginPct < salesMonths[i-1].grossMarginPct) {
        streak++;
      } else break;
    }
    if (streak >= 3) {
      const start = salesMonths[salesMonths.length - streak].month;
      const end   = salesMonths[salesMonths.length - 1].month;
      return { streak, start, end };
    }
    return null;
  }, [trend]);

  /* KPI */
  const kpi = useMemo<KpiData|null>(() => {
    const i = trend.findIndex(r => r.month === activeMonth); if(i<0) return null;
    const c = trend[i]; const p = i>0 ? trend[i-1] : null;
    // YTD: sum from Jan to activeMonth
    const ytdRows = trend.filter(r => r.month <= activeMonth);
    const ytdSales       = ytdRows.reduce((a,r) => a+r.sales, 0);
    const ytdGrossProfit = ytdRows.reduce((a,r) => a+r.grossProfit, 0);
    const ytdNetProfit   = ytdRows.reduce((a,r) => a+r.netProfit, 0);
    const ytdSga         = ytdRows.reduce((a,r) => a+r.sga, 0);
    const ytdCaseCount   = ytdRows.reduce((a,r) => a+r.caseCount, 0);
    return {
      sales: c.sales, grossProfit: c.grossProfit, grossMarginPct: c.grossMarginPct,
      sga: c.sga, netProfit: c.netProfit, caseCount: c.caseCount,
      salesChange:        p ? calcChange(c.sales, p.sales) : undefined,
      grossProfitChange:  p ? calcChange(c.grossProfit, p.grossProfit) : undefined,
      grossMarginChange:  p ? Math.round((c.grossMarginPct - p.grossMarginPct)*10)/10 : undefined,
      sgaChange:          p ? calcChange(c.sga, p.sga) : undefined,
      netProfitChange:    p ? calcChange(c.netProfit, p.netProfit) : undefined,
      caseChange:         p ? calcChange(c.caseCount, p.caseCount) : undefined,
      ytdSales, ytdGrossProfit, ytdNetProfit, ytdSga, ytdCaseCount,
    };
  }, [trend, activeMonth]);

  /* SGA 統合 */
  const { mergedSgaBreakdown, mergedSgaItems, sgaPieData } = useMemo(() => {
    const yt: Record<string,number> = {};
    sgaBreakdown.forEach(r => Object.entries(r.items).forEach(([k,v]) => { yt[k]=(yt[k]??0)+v; }));
    const gt = Object.values(yt).reduce((a,b)=>a+b,0);
    const th = gt*0.03;
    const main = Object.keys(yt).filter(k => yt[k]>=th);
    const merged = sgaBreakdown.map(row => {
      const ni: Record<string,number> = {}; let ot=0;
      Object.entries(row.items).forEach(([k,v]) => { main.includes(k)?ni[k]=v:ot+=v; });
      if(ot) ni["その他"]=Math.round(ot);
      main.forEach(k => { if(!(k in ni)) ni[k]=0; });
      return { ...row, items: ni };
    });
    const allItems = [...main,"その他"].filter(k => merged.some(r=>(r.items[k]??0)!==0));
    let pie: {name:string;value:number}[] = []; let ov=0;
    Object.entries(yt).forEach(([k,v]) => { v>=th ? pie.push({name:k,value:Math.round(v)}) : ov+=v; });
    if(ov>0) pie.push({name:"その他",value:Math.round(ov)});
    pie.sort((a,b)=>b.value-a.value);
    return { mergedSgaBreakdown: merged, mergedSgaItems: allItems, sgaPieData: pie };
  }, [sgaBreakdown]);

  const handlePrint = useCallback(() => window.print(), []);
  const handleExportCsv = useCallback(() => exportCsv(trend), [trend]);

  /* ─── ローディング / エラー ─── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:"linear-gradient(135deg,#e8f0fe,#f8fafc)"}}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-slate-500 text-sm font-medium">数据加载中...</p>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600 max-w-lg">
        <p className="font-bold mb-1">错误</p><p className="text-sm">{error}</p>
      </div>
    </div>
  );

  const latestMonth = trend[trend.length-1]?.month ?? "—";
  const prevMonth   = (() => { const i=trend.findIndex(r=>r.month===activeMonth); return i>0?trend[i-1].month:null; })();

  return (
    <div className="min-h-screen" style={{background:"linear-gradient(160deg,#f0f4ff 0%,#f1f5f9 40%,#e8f4f0 100%)"}}>

      {/* ══ HEADER ══ */}
      <div style={{background:"linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1e40af 100%)"}} className="px-8 py-5 shadow-xl print-header">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-lg">OT</div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">月度销售・费用仪表盘</h1>
              <p className="text-blue-200 text-xs mt-0.5">
                {selectedYear}年　最新月：{latestMonth}　有效件数：<span className="text-white font-bold">{validCount.toLocaleString()}</span> / {totalCount.toLocaleString()} 件
                {updatedAt && (
                  <span className="ml-3 text-blue-300">
                    数据更新：{updatedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-white/10 p-1 rounded-xl no-print">
              {["2026"].map(y => (
                <button key={y} onClick={() => { setSelectedYear(y); setSelectedMonth(""); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedYear===y?"bg-white text-blue-700 shadow":"text-blue-200 hover:bg-white/20"}`}>{y}</button>
              ))}
            </div>
            {/* 操作ボタン */}
            <div className="flex gap-2 no-print">
              <button onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20">
                ⬇ CSV
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all border border-white/20">
                🖨 打印
              </button>
            </div>
            <div className="hidden sm:flex gap-4 text-xs no-print">
              {[["销售额",C.sales],["粗利润",C.grossProfit],["净利润",C.netProfit]].map(([n,c])=>(
                <span key={n} className="flex items-center gap-1.5 text-blue-100">
                  <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:c as string}}/>
                  {n}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-7 space-y-8">

        {/* ══ ① KPI ══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">经营概况</h2>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">{activeMonth}</span>
              {prevMonth && <span className="text-slate-400 text-xs">上月：{prevMonth}</span>}
            </div>
            <select value={activeMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="no-print text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
              {trend.map(r => <option key={r.month} value={r.month}>{r.month}</option>)}
            </select>
          </div>
          {kpi ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {KPI_CONFIG.map(cfg => <KpiCard key={cfg.key} cfg={cfg} kpi={kpi}/>)}
            </div>
          ) : <p className="text-sm text-slate-400">暂无数据</p>}
        </section>

        {/* ══ ② トレンド（タブ） ══ */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">月度趋势</h2>
            </div>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl no-print">
              {(["amount","rate"] as const).map(t => (
                <button key={t} onClick={() => setTrendTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${trendTab===t?"bg-white text-blue-600 shadow":"text-slate-500 hover:text-slate-700"}`}>
                  {t==="amount" ? "金额趋势" : "利润率・案件数"}
                </button>
              ))}
            </div>
          </div>

          {/* 粗利益率連続下降アラート */}
          {marginDeclineWarning && (
            <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
              <span className="text-base">⚠️</span>
              <span>粗利率已<strong>连续 {marginDeclineWarning.streak} 个月</strong>下滑（{marginDeclineWarning.start} → {marginDeclineWarning.end}）</span>
            </div>
          )}

          {/* 空月份注記 */}
          {zeroSalesMonths.length > 0 && (
            <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
              <span className="text-base">ℹ️</span>
              <span>无销售记录月份（仅含SGA费用）：<strong>{zeroSalesMonths.join("、")}</strong></span>
            </div>
          )}

          <Card>
            {trendTab === "amount" ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend} margin={{top:8,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} {...axisProps}/>
                  <YAxis tickFormatter={fM} tick={{fontSize:11,fill:"#94a3b8"}} width={56} {...axisProps}/>
                  <Tooltip formatter={(v:number)=>formatJPY(v)} labelStyle={{fontWeight:700}} contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:12,paddingTop:12}}/>
                  <Line type="monotone" dataKey="sales"       name="销售额" stroke={C.sales}       strokeWidth={2.5} dot={false}/>
                  <Line type="monotone" dataKey="grossProfit" name="粗利润" stroke={C.grossProfit} strokeWidth={2.5} dot={false}/>
                  <Line type="monotone" dataKey="sga"         name="SGA费用" stroke={C.sga}       strokeWidth={2}   dot={false} strokeDasharray="6 3"/>
                  <Line type="monotone" dataKey="netProfit"   name="净利润" stroke={C.netProfit}   strokeWidth={2.5} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trend} margin={{top:8,right:52,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} {...axisProps}/>
                  <YAxis yAxisId="c" orientation="left"  tick={{fontSize:11,fill:"#94a3b8"}} width={40} {...axisProps}/>
                  <YAxis yAxisId="p" orientation="right" tick={{fontSize:11,fill:"#94a3b8"}} width={46} tickFormatter={v=>v+"%"} domain={[0,"auto"]} {...axisProps}/>
                  <Tooltip formatter={(v:number,n:string)=>n.includes("%")||n.includes("率")||n.includes("占")?v+"%":v+" 件"} labelStyle={{fontWeight:700}} contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:12,paddingTop:12}}/>
                  <Bar  yAxisId="c" dataKey="caseCount"     name="案件数"   fill="#cbd5e1" radius={[4,4,0,0]}/>
                  <Line yAxisId="p" type="monotone" dataKey="grossMarginPct" name="粗利率%"    stroke={C.grossProfit} strokeWidth={2.5} dot={false}/>
                  <Line yAxisId="p" type="monotone" dataKey="sgaRatioPct"    name="SGA占比%" stroke={C.sga}         strokeWidth={2}   dot={false} strokeDasharray="6 3"/>
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>
        </section>

        {/* ══ ③ ランキング ══ */}
        <section>
          <SecTitle>粗利润排行</SecTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              { label:"月度 Top 10", badge:activeMonth,       badgeCls:"bg-blue-100 text-blue-700",    data:monthlyProfitRanking, fill:C.grossProfit },
              { label:"年度 Top 10", badge:selectedYear+"年", badgeCls:"bg-emerald-100 text-emerald-700",data:yearlyProfitRanking,  fill:"#34d399" },
            ].map(({ label, badge, badgeCls, data, fill }) => (
              <div key={label} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
                </div>
                <Card className="flex-1">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={data} layout="vertical" margin={{left:4,right:24,top:4,bottom:4}}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0"/>
                      <XAxis type="number" tickFormatter={fM} tick={{fontSize:10,fill:"#94a3b8"}} {...axisProps}/>
                      <YAxis type="category" dataKey="name" width={130} tick={{fontSize:11,fill:"#475569"}}
                        tickFormatter={(v:string)=>v.length>16?v.slice(0,16)+"…":v} {...axisProps}/>
                      <Tooltip formatter={(v:number)=>formatJPY(v)} contentStyle={tooltipStyle}/>
                      <Bar dataKey="grossProfit" name="粗利润" fill={fill} radius={[0,6,6,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* ══ ④ Business Scope ══ */}
        <section>
          <SecTitle>业务类型分析</SecTitle>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[
              { label:"月度", badge:activeMonth,       badgeCls:"bg-blue-100 text-blue-700",     data:monthlyScope },
              { label:"年度累计", badge:selectedYear+"年", badgeCls:"bg-emerald-100 text-emerald-700", data:scopeBreakdown },
            ].map(({ label, badge, badgeCls, data }) => (
              <div key={label} className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-slate-500">{label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
                </div>
                <Card className="flex-1"><ScopePanel data={data}/></Card>
              </div>
            ))}
          </div>
        </section>

        {/* ══ ⑤ SGA ══ */}
        <section>
          <SecTitle>SGA 费用分析</SecTitle>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 flex flex-col">
              <p className="text-xs text-slate-400 mb-4">{selectedYear}年 月度推移（年度占比 3% 以下合并为「其他」）</p>
              <div className="flex-1 min-h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mergedSgaBreakdown.filter(r => r.total > 0)} margin={{top:4,right:16,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                  <XAxis dataKey="month" tick={{fontSize:11,fill:"#94a3b8"}} {...axisProps}/>
                  <YAxis tickFormatter={fM} tick={{fontSize:11,fill:"#94a3b8"}} width={56} {...axisProps}/>
                  <Tooltip formatter={(v:number)=>formatJPY(v)} contentStyle={tooltipStyle}/>
                  <Legend wrapperStyle={{fontSize:11}}/>
                  {mergedSgaItems.map((item,i)=>(
                    <Bar key={item} dataKey={`items.${item}`} name={item} stackId="s" fill={SGA_PALETTE[i%SGA_PALETTE.length]}/>
                  ))}
                </BarChart>
              </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col">
              <div className="mb-3">
                <p className="text-xs text-slate-400">{selectedYear}年 年度费用明细</p>
                <p className="text-lg font-bold text-slate-700 mt-1">{formatJPY(sgaPieData.reduce((a,b)=>a+b.value,0))}</p>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <Treemap data={sgaPieData.map((d,i)=>({...d,fill:SGA_PALETTE[i%SGA_PALETTE.length]}))}
                  dataKey="value" content={<TmCell/>}>
                  <Tooltip formatter={(v:number)=>formatJPY(v)} contentStyle={tooltipStyle}/>
                </Treemap>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5 overflow-y-auto max-h-40 pr-1">
                {sgaPieData.map((d,i)=>(
                  <div key={d.name} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{backgroundColor:SGA_PALETTE[i%SGA_PALETTE.length]}}/>
                    <span className="truncate flex-1">{d.name}</span>
                    <span className="text-slate-400 font-medium flex-shrink-0">{fM(d.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

      </div>
    </div>
  );
}
