"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface KintoneRecord {
  $id: { value: string };
  AWB_NO: { value: string };
  当社案件番号: { value: string };
  顧客名: { value: string };
  案件テーマ: { value: string };
  操作ステータス: { value: string };
  Mode: { value: string };
  ETD: { value: string };
  ETA: { value: string };
  作成日時: { value: string };
}

function modeColor(v: string) {
  if (v === "Export") return "#60a5fa";
  if (v === "Import") return "#f59e0b";
  if (v === "Domestic transport") return "#4caf50";
  return "var(--text-dim)";
}
function statusColor(v: string) {
  if (v.startsWith("◆")) return "#f97316";
  if (v.startsWith("■")) return "#a78bfa";
  if (v.startsWith("▲")) return "#4caf50";
  return "var(--text-dim)";
}
function fmtDate(s: string) { return s || "—"; }
function fmtCreated(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function generateCSV(records: KintoneRecord[]): string {
  const headers = ["AWB_NO", "案件番号", "顧客名", "案件テーマ", "Mode", "ETD", "ETA", "操作ステータス", "登録日時"];
  const escape = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;
  const rows = records.map(r => [
    r.AWB_NO.value, r.当社案件番号.value, r.顧客名.value, r.案件テーマ.value,
    r.Mode.value, r.ETD.value, r.ETA.value, r.操作ステータス.value, r.作成日時.value,
  ].map(escape).join(","));
  return [headers.join(","), ...rows].join("\r\n");
}

function downloadCSV(content: string, filename: string) {
  const bom = "﻿";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function AWBSearch() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [customer, setCustomer] = useState("");
  const [status, setStatus]     = useState("");
  const [records, setRecords]   = useState<KintoneRecord[]>([]);
  const [loading, setLoading]   = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError]       = useState("");
  const [offset, setOffset]     = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [knownStatuses, setKnownStatuses] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Discover status options on mount
  useEffect(() => {
    fetch("/api/search?limit=500")
      .then(r => r.json())
      .then(d => {
        const recs: KintoneRecord[] = d.records ?? [];
        const uniq = Array.from(new Set(recs.map(r => r.操作ステータス.value).filter(Boolean))) as string[];
        setKnownStatuses(uniq);
      });
  }, []);

  const fetchRecords = useCallback(async (
    from: string, to: string, cust: string, st: string, off: number, append = false
  ) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ dateFrom: from, dateTo: to, customer: cust, status: st, offset: String(off) });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const recs: KintoneRecord[] = data.records ?? [];
      setRecords(prev => append ? [...prev, ...recs] : recs);
      setHasMore(recs.length === 50);
      setSearched(true);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = useCallback(() => {
    clearTimeout(debounceRef.current);
    setOffset(0);
    fetchRecords(dateFrom, dateTo, customer, status, 0);
  }, [dateFrom, dateTo, customer, status, fetchRecords]);

  const handleReset = () => {
    setDateFrom(""); setDateTo(""); setCustomer(""); setStatus("");
    setRecords([]); setSearched(false); setOffset(0); setHasMore(false); setError("");
  };

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchRecords(dateFrom, dateTo, customer, status, next, true);
  };

  const exportCSV = async () => {
    setExporting(true); setError("");
    try {
      let all: KintoneRecord[] = [];
      let off = 0;
      while (true) {
        const params = new URLSearchParams({ dateFrom, dateTo, customer, status, offset: String(off), limit: "500" });
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "API error");
        const recs: KintoneRecord[] = data.records ?? [];
        all = all.concat(recs);
        if (recs.length < 500) break;
        off += 500;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadCSV(generateCSV(all), `AWB実績_${date}.csv`);
    } catch (e) { setError(String(e)); }
    finally { setExporting(false); }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · KINTONE</div>
          <h1 style={s.title}>AWB 実績搜索</h1>
          <p style={s.subtitle}>期間・顧客・状態の複合条件でAWB実績を検索・CSV出力</p>
        </div>
        {searched && (
          <div style={s.resultBadge}>
            {loading ? "検索中…" : `${records.length} 件表示${hasMore ? "（続きあり）" : ""}`}
          </div>
        )}
      </header>

      {/* Filter Panel */}
      <div style={s.filterPanel}>
        <div style={s.filterTitle}>🔍 検索条件</div>
        <div style={s.filterGrid}>
          {/* Date range */}
          <div style={s.filterGroup}>
            <label style={s.label}>登録期間（From）</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={s.input} />
          </div>
          <div style={s.filterGroup}>
            <label style={s.label}>登録期間（To）</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={s.input} />
          </div>
          {/* Customer */}
          <div style={s.filterGroup}>
            <label style={s.label}>顧客名</label>
            <input
              type="text" value={customer} placeholder="部分一致で検索…"
              onChange={e => setCustomer(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              style={s.input}
            />
          </div>
          {/* Status */}
          <div style={s.filterGroup}>
            <label style={s.label}>操作ステータス</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={s.input}>
              <option value="">全ステータス</option>
              {knownStatuses.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div style={s.btnRow}>
          <button style={s.searchBtn} onClick={handleSearch} disabled={loading}>
            {loading ? "検索中…" : "🔍 検索"}
          </button>
          <button style={s.resetBtn} onClick={handleReset} disabled={loading}>
            ✕ リセット
          </button>
          {searched && records.length > 0 && (
            <button style={s.exportBtn} onClick={exportCSV} disabled={exporting || loading}>
              {exporting ? "導出中…" : "📥 导出 CSV"}
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && <div style={s.errorBox}>⚠ {error}</div>}

      {/* Results */}
      {!searched ? (
        <div style={s.emptyState}>
          <div style={s.emptyIcon}>📋</div>
          <div style={s.emptyText}>条件を入力して「検索」を押してください</div>
        </div>
      ) : (
        <>
          <div style={s.tableWrap}>
            <table style={s.table}>
              <thead>
                <tr style={s.thead}>
                  <th style={{ ...s.th, width: 130 }}>AWB NO</th>
                  <th style={{ ...s.th, width: 120 }}>案件番号</th>
                  <th style={{ ...s.th, minWidth: 180 }}>顧客名</th>
                  <th style={{ ...s.th, minWidth: 220 }}>案件テーマ</th>
                  <th style={{ ...s.th, width: 90 }}>Mode</th>
                  <th style={{ ...s.th, width: 100 }}>ETD</th>
                  <th style={{ ...s.th, width: 100 }}>ETA</th>
                  <th style={{ ...s.th, width: 150 }}>操作ステータス</th>
                  <th style={{ ...s.th, width: 110 }}>登録日時</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={9} style={s.emptyCell}>条件に一致するデータがありません</td>
                  </tr>
                ) : (
                  records.map((r, i) => (
                    <tr key={r.$id.value} style={{ ...s.tr, background: i % 2 === 0 ? "var(--card)" : "var(--card2)" }}>
                      <td style={s.td}>
                        <span style={s.awbNo}>{r.AWB_NO.value || "—"}</span>
                      </td>
                      <td style={s.td}>
                        <span style={s.caseNo}>{r.当社案件番号.value || "—"}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 11 }}>{r.顧客名.value || "—"}</span>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 11, color: "var(--text-dim)" }}>{r.案件テーマ.value || "—"}</span>
                      </td>
                      <td style={s.td}>
                        {r.Mode.value ? (
                          <span style={{ ...s.modeTag, color: modeColor(r.Mode.value), borderColor: `${modeColor(r.Mode.value)}44` }}>
                            {r.Mode.value === "Domestic transport" ? "Dom." : r.Mode.value}
                          </span>
                        ) : <span style={s.dash}>—</span>}
                      </td>
                      <td style={{ ...s.td, fontSize: 11 }}>{fmtDate(r.ETD.value)}</td>
                      <td style={{ ...s.td, fontSize: 11 }}>{fmtDate(r.ETA.value)}</td>
                      <td style={s.td}>
                        {r.操作ステータス.value ? (
                          <span style={{
                            ...s.statusTag,
                            color: statusColor(r.操作ステータス.value),
                            borderColor: `${statusColor(r.操作ステータス.value)}44`,
                            background: `${statusColor(r.操作ステータス.value)}11`,
                          }}>{r.操作ステータス.value}</span>
                        ) : <span style={s.dash}>—</span>}
                      </td>
                      <td style={{ ...s.td, fontSize: 10, color: "var(--text-dim)" }}>{fmtCreated(r.作成日時.value)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {loading && <div style={s.loadingRow}>データ取得中…</div>}
          </div>

          {hasMore && !loading && (
            <div style={s.loadMoreWrap}>
              <button style={s.loadMoreBtn} onClick={loadMore}>さらに読み込む（+50件）</button>
            </div>
          )}
        </>
      )}

      <footer style={s.footer}>OPTEC · AWB 実績搜索 · Powered by Kintone REST API</footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--dark)", paddingBottom: 48 },

  header: {
    background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "24px 32px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", color: "var(--gold)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 4, marginBottom: 10, textTransform: "uppercase",
  },
  title: { fontSize: 24, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "var(--text-dim)" },
  resultBadge: {
    fontSize: 12, color: "var(--gold)", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", padding: "6px 16px", borderRadius: 20, alignSelf: "center",
  },

  filterPanel: {
    background: "var(--dark2)", borderBottom: "1px solid var(--border)",
    padding: "20px 32px",
  },
  filterTitle: {
    fontSize: 12, fontWeight: 700, color: "var(--gold)",
    letterSpacing: "0.08em", marginBottom: 14,
  },
  filterGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 16, marginBottom: 16,
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.04em" },
  input: { width: "100%" },

  btnRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  searchBtn: {
    background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 13, padding: "8px 24px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
  },
  resetBtn: {
    background: "transparent", border: "1px solid var(--border)",
    color: "var(--text-dim)", fontSize: 12, padding: "8px 18px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
  },
  exportBtn: {
    background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.4)",
    color: "#60a5fa", fontSize: 12, padding: "8px 20px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    marginLeft: "auto",
  },

  errorBox: {
    margin: "12px 32px", padding: "10px 16px",
    background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
    borderRadius: 8, color: "#e05555", fontSize: 12,
  },

  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 32px", gap: 16,
  },
  emptyIcon: { fontSize: 48, opacity: 0.3 },
  emptyText: { fontSize: 14, color: "var(--text-dim)" },

  tableWrap: {
    margin: "20px 32px 0",
    border: "1px solid var(--border)", borderRadius: 10,
    overflow: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  table: { width: "100%", borderCollapse: "collapse", tableLayout: "auto" },
  thead: { background: "var(--dark2)" },
  th: {
    padding: "10px 12px", fontSize: 11, fontWeight: 700,
    color: "var(--gold)", letterSpacing: "0.06em", textAlign: "left",
    borderBottom: "2px solid var(--border-strong)",
    borderRight: "1px solid var(--border)", whiteSpace: "nowrap",
  },
  tr: {},
  td: {
    padding: "9px 12px", borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)", verticalAlign: "middle",
    fontSize: 12, color: "var(--text)",
  },
  emptyCell: { textAlign: "center", padding: "40px", color: "var(--text-dim)", fontSize: 13 },
  awbNo: { fontFamily: "monospace", fontSize: 12, color: "#60a5fa", fontWeight: 700 },
  caseNo: { fontFamily: "monospace", fontSize: 11, color: "var(--gold-light)" },
  dash: { color: "rgba(232,224,208,0.2)" },
  statusTag: {
    display: "inline-block", fontSize: 10, fontWeight: 700,
    padding: "2px 7px", borderRadius: 4, border: "1px solid", whiteSpace: "nowrap",
  },
  modeTag: {
    display: "inline-block", fontSize: 10, fontWeight: 700,
    padding: "2px 7px", borderRadius: 4, border: "1px solid",
  },
  loadingRow: { textAlign: "center", padding: "20px", color: "var(--text-dim)", fontSize: 13 },
  loadMoreWrap: { display: "flex", justifyContent: "center", padding: "20px 32px" },
  loadMoreBtn: {
    background: "rgba(201,169,110,0.08)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 12, padding: "8px 28px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
  },
  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 20,
  },
};
