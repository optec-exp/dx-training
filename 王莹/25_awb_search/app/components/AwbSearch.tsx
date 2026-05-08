"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "✅起飞降落（OS）", label: "✅起飞降落（OS）" },
  { value: "✅起飞降落（TCC）", label: "✅起飞降落（TCC）" },
  { value: "🆘重点关注", label: "🆘重点关注" },
  { value: "🔶跟进操作", label: "🔶跟进操作" },
  { value: "🛑暂停案件", label: "🛑暂停案件" },
  { value: "🟪日本跟进", label: "🟪日本跟进" },
  { value: "🟪GC対応", label: "🟪GC対応" },
  { value: "OS跟进起飞降落GC依赖", label: "OS跟进起飞降落GC依赖" },
];

interface AwbRecord {
  $id: { value: string };
  当社案件番号: { value: string };
  AWB_NO: { value: string };
  MAWB: { value: string };
  HAWB: { value: string };
  顧客名: { value: string };
  ETD: { value: string | null };
  ETA: { value: string | null };
  積込港: { value: string };
  仕向地: { value: string };
  操作ステータス: { value: string };
  Transport_Type: { value: string };
  案件取消: { value: string[] };
}

function StatusBadge({ value }: { value: string }) {
  if (!value) return <span className="text-[#7aa3c8] text-xs">—</span>;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e3a5f] text-[#93c5fd] whitespace-nowrap">
      {value}
    </span>
  );
}

function TransportBadge({ value }: { value: string }) {
  const colors: Record<string, string> = {
    NFO: "bg-orange-900/50 text-orange-300",
    OBC: "bg-blue-900/50 text-blue-300",
    ECO: "bg-green-900/50 text-green-300",
  };
  const cls = colors[value] ?? "bg-slate-800 text-slate-400";
  if (!value) return <span className="text-[#7aa3c8] text-xs">—</span>;
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${cls}`}>
      {value}
    </span>
  );
}

// Date input with calendar icon click-through
function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-xs text-[#7aa3c8] mb-1.5 font-medium">{label}</label>
      <div className="relative">
        <input
          ref={ref}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#06111f] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors [color-scheme:dark] cursor-pointer"
        />
        {/* invisible overlay so clicking anywhere opens the picker */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => ref.current?.showPicker?.()}
        />
      </div>
    </div>
  );
}

export default function AwbSearch() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customer, setCustomer] = useState("");
  const [awbNo, setAwbNo] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [status, setStatus] = useState("all");
  const [records, setRecords] = useState<AwbRecord[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = useCallback(async (params?: URLSearchParams) => {
    setLoading(true);
    setError("");
    try {
      const p = params ?? new URLSearchParams();
      if (!params) {
        if (dateFrom) p.set("dateFrom", dateFrom);
        if (dateTo) p.set("dateTo", dateTo);
        if (customer.trim()) p.set("customer", customer.trim());
        if (awbNo.trim()) p.set("awbNo", awbNo.trim());
        if (caseNo.trim()) p.set("caseNo", caseNo.trim());
        if (status !== "all") p.set("status", status);
      }

      const res = await fetch(`/api/awb?${p}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "取得失败");
      }
      const data = await res.json();
      setRecords(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, customer, awbNo, caseNo, status]);

  // Load all records on mount
  useEffect(() => {
    search(new URLSearchParams());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = useCallback(() => {
    if (!records || records.length === 0) return;

    const headers = [
      "案件番号", "AWB NO", "MAWB NO", "HAWB NO",
      "顧客名", "ETD", "ETA", "積込港", "仕向地", "操作ステータス", "Transport Type",
    ];

    const rows = records.map((r) => [
      r.当社案件番号.value,
      r.AWB_NO.value,
      r.MAWB.value,
      r.HAWB.value,
      r.顧客名.value,
      r.ETD.value ?? "",
      r.ETA.value ?? "",
      r.積込港.value,
      r.仕向地.value,
      r.操作ステータス.value,
      r.Transport_Type.value,
    ]);

    const BOM = "﻿";
    const csv =
      BOM +
      [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    a.download = `AWB_実绩_${ts}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  const activeCount = records?.filter((r) => !r.案件取消.value.includes("はい")).length ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1e3a5f] bg-[#06111f]/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
            ✈
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">AWB 実绩搜索</h1>
            <p className="text-xs text-[#7aa3c8]">按期间・客户・AWB NO・状态筛选 Kintone 案件数据</p>
          </div>
        </div>
      </header>

      {/* Search Panel */}
      <div className="bg-[#0d1f35] border-b border-[#1e3a5f]">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            {/* Date From */}
            <DateInput label="ETD 开始日" value={dateFrom} onChange={setDateFrom} />

            {/* Date To */}
            <DateInput label="ETD 结束日" value={dateTo} onChange={setDateTo} />

            {/* Customer */}
            <div>
              <label className="block text-xs text-[#7aa3c8] mb-1.5 font-medium">客户名</label>
              <input
                type="text"
                placeholder="输入客户名…"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="w-full bg-[#06111f] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white placeholder-[#3a5a7a] focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* AWB NO */}
            <div>
              <label className="block text-xs text-[#7aa3c8] mb-1.5 font-medium">AWB NO</label>
              <input
                type="text"
                placeholder="输入 AWB NO…"
                value={awbNo}
                onChange={(e) => setAwbNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="w-full bg-[#06111f] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white placeholder-[#3a5a7a] focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Case No */}
            <div>
              <label className="block text-xs text-[#7aa3c8] mb-1.5 font-medium">案件番号</label>
              <input
                type="text"
                placeholder="输入案件番号…"
                value={caseNo}
                onChange={(e) => setCaseNo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
                className="w-full bg-[#06111f] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white placeholder-[#3a5a7a] focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs text-[#7aa3c8] mb-1.5 font-medium">操作ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#06111f] border border-[#1e3a5f] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => search()}
              disabled={loading}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-900 disabled:text-orange-500 text-white font-semibold rounded text-sm transition-colors"
            >
              {loading ? "搜索中…" : "🔍 搜索"}
            </button>

            {records && records.length > 0 && (
              <button
                onClick={exportCsv}
                className="px-5 py-2 bg-[#06111f] border border-[#1e3a5f] hover:border-orange-500 text-[#93c5fd] hover:text-orange-400 rounded text-sm transition-colors"
              >
                ⬇ 导出 CSV
              </button>
            )}

            {records !== null && !loading && (
              <span className="text-sm text-[#7aa3c8] ml-1">
                共 <span className="text-white font-semibold">{records.length}</span> 件
                {records.length !== activeCount && (
                  <span className="ml-1">
                    (有效 <span className="text-orange-400 font-semibold">{activeCount}</span> 件)
                  </span>
                )}
              </span>
            )}
          </div>

          {error && (
            <div className="mt-3 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && records !== null && records.length === 0 && (
          <div className="text-center py-24 text-[#3a5a7a] text-sm">
            没有符合条件的数据
          </div>
        )}

        {records && records.length > 0 && !loading && (
          <div className="overflow-x-auto rounded-lg border border-[#1e3a5f]">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0d1f35] text-[#7aa3c8] text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">案件番号</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">AWB NO</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">MAWB</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">HAWB</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">顧客名</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">ETD</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">ETA</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">積込港</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">仕向地</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">Type</th>
                  <th className="px-4 py-3 text-left font-semibold border-b border-[#1e3a5f]">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => {
                  const cancelled = r.案件取消.value.includes("はい");
                  return (
                    <tr
                      key={r.$id.value}
                      className={`border-b border-[#1e3a5f]/50 transition-colors ${
                        cancelled
                          ? "opacity-40 bg-[#06111f]"
                          : i % 2 === 0
                          ? "bg-[#06111f] hover:bg-[#0d1f35]"
                          : "bg-[#091828] hover:bg-[#0d1f35]"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-orange-400 text-xs">
                        {r.当社案件番号.value || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-white text-xs font-semibold">
                        {r.AWB_NO.value || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#93c5fd] text-xs">
                        {r.MAWB.value || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[#93c5fd] text-xs">
                        {r.HAWB.value || "—"}
                      </td>
                      <td className="px-4 py-3 text-white max-w-[160px] truncate" title={r.顧客名.value || ""}>
                        {r.顧客名.value || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#7aa3c8] font-mono text-xs whitespace-nowrap">
                        {r.ETD.value ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#7aa3c8] font-mono text-xs whitespace-nowrap">
                        {r.ETA.value ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-[#e2eaf4] text-xs">
                        {r.積込港.value || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#e2eaf4] text-xs max-w-[120px] truncate">
                        {r.仕向地.value || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <TransportBadge value={r.Transport_Type.value} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={r.操作ステータス.value} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
