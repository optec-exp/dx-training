"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────
interface KintoneRecord {
  $id: { value: string };
  当社案件番号: { value: string };
  顧客名: { value: string };
  案件テーマ: { value: string };
  操作ステータス: { value: string };
  Mode: { value: string };
  ETD: { value: string };
  ETA: { value: string };
  AWB_NO: { value: string };
  作成日時: { value: string };
}

const MODE_OPTIONS = [
  { value: "",                  label: "全 Mode" },
  { value: "Export",            label: "Export" },
  { value: "Import",            label: "Import" },
  { value: "Domestic transport",label: "Domestic" },
];

function statusColor(v: string): string {
  if (v.startsWith("◆")) return "#f97316";
  if (v.startsWith("■")) return "#a78bfa";
  if (v.startsWith("▲")) return "#4caf50";
  return "var(--text-dim)";
}
function modeColor(v: string): string {
  if (v === "Export") return "#60a5fa";
  if (v === "Import") return "#f59e0b";
  if (v === "Domestic transport") return "#4caf50";
  return "var(--text-dim)";
}
function fmtDate(s: string) { return s ? s : "—"; }
function fmtCreated(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function KintoneViewer() {
  const [records, setRecords] = useState<KintoneRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [status, setStatus]   = useState("");
  const [mode, setMode]       = useState("");
  const [offset, setOffset]   = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal]     = useState(0);
  const [knownStatuses, setKnownStatuses] = useState<string[]>([]);
  const searchRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchRecords = useCallback(async (
    q: string, st: string, md: string, off: number, append = false
  ) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search: q, status: st, mode: md, offset: String(off),
      });
      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const recs: KintoneRecord[] = data.records ?? [];
      setRecords(prev => append ? [...prev, ...recs] : recs);
      setHasMore(recs.length === 50);
      if (!append) setTotal(recs.length < 50 ? recs.length : (off + recs.length));
      if (!q && !st && !md && off === 0) {
        const uniq = Array.from(new Set(recs.map((r: KintoneRecord) => r.操作ステータス.value).filter(Boolean))) as string[];
        setKnownStatuses(prev => prev.length ? prev : uniq);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchRecords("", "", "", 0); }, [fetchRecords]);

  // Search debounce
  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setOffset(0);
      fetchRecords(search, status, mode, 0);
    }, 400);
    return () => clearTimeout(searchRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, mode]);

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchRecords(search, status, mode, next, true);
  };

  const refresh = () => { setOffset(0); fetchRecords(search, status, mode, 0); };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · Kintone</div>
          <h1 style={s.title}>案件列表查看器</h1>
          <p style={s.subtitle}>
            Kintone REST API · App ID: 1001 · 状態過濾 · キーワード検索
          </p>
        </div>
        <div style={s.headerRight}>
          <div style={s.countBadge}>
            {loading ? "読み込み中..." : `${records.length} 件表示`}
          </div>
          <button style={s.refreshBtn} onClick={refresh} disabled={loading}>
            {loading ? "…" : "↻ 更新"}
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div style={s.toolbar}>
        {/* Search */}
        <div style={s.searchWrap}>
          <span style={s.searchIcon}>🔍</span>
          <input
            style={{ ...s.searchInput }}
            placeholder="案件番号 / 顧客名 / テーマ / AWB で検索…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Mode filter */}
        <select
          value={mode}
          onChange={e => { setMode(e.target.value); setOffset(0); }}
          style={s.modeSelect}
        >
          {MODE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Status filter tabs */}
      <div style={s.statusBar}>
        {/* 全ステータス */}
        <button
          style={{
            ...s.statusBtn,
            background: status === "" ? "rgba(201,169,110,0.15)" : "transparent",
            borderColor: status === "" ? "var(--gold)" : "var(--border)",
            color: status === "" ? "var(--gold)" : "var(--text-dim)",
          }}
          onClick={() => { setStatus(""); setOffset(0); }}
        >全ステータス</button>
        {/* Dynamic status buttons from actual Kintone data */}
        {knownStatuses.map(v => {
          const c = statusColor(v);
          return (
            <button
              key={v}
              style={{
                ...s.statusBtn,
                background: status === v ? `${c}22` : "transparent",
                borderColor: status === v ? c : "var(--border)",
                color: status === v ? c : "var(--text-dim)",
              }}
              onClick={() => { setStatus(v); setOffset(0); }}
            >{v}</button>
          );
        })}
        {/* 未設定 */}
        <button
          style={{
            ...s.statusBtn,
            background: status === "__empty__" ? "rgba(232,224,208,0.08)" : "transparent",
            borderColor: status === "__empty__" ? "var(--text-dim)" : "var(--border)",
            color: status === "__empty__" ? "var(--text)" : "var(--text-dim)",
          }}
          onClick={() => { setStatus("__empty__"); setOffset(0); }}
        >未設定</button>
      </div>

      {/* Error */}
      {error && (
        <div style={s.errorBox}>⚠ {error}</div>
      )}

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={{ ...s.th, width: 130 }}>案件番号</th>
              <th style={{ ...s.th, minWidth: 200 }}>顧客名</th>
              <th style={{ ...s.th, minWidth: 260 }}>案件テーマ</th>
              <th style={{ ...s.th, width: 150 }}>操作ステータス</th>
              <th style={{ ...s.th, width: 90 }}>Mode</th>
              <th style={{ ...s.th, width: 90 }}>ETD</th>
              <th style={{ ...s.th, width: 90 }}>ETA</th>
              <th style={{ ...s.th, width: 140 }}>AWB</th>
              <th style={{ ...s.th, width: 90 }}>登録日時</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && !loading ? (
              <tr>
                <td colSpan={9} style={s.emptyCell}>
                  {error ? "エラーが発生しました" : "データがありません"}
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={r.$id.value} style={{ ...s.tr, background: i % 2 === 0 ? "var(--card)" : "var(--card2)" }}>
                  <td style={s.td}>
                    <span style={s.caseNo}>{r.当社案件番号.value || "—"}</span>
                  </td>
                  <td style={s.td}>
                    <span style={s.customer}>{r.顧客名.value || "—"}</span>
                  </td>
                  <td style={s.td}>
                    <span style={s.theme}>{r.案件テーマ.value || "—"}</span>
                  </td>
                  <td style={s.td}>
                    {r.操作ステータス.value ? (
                      <span style={{
                        ...s.statusTag,
                        color: statusColor(r.操作ステータス.value),
                        borderColor: `${statusColor(r.操作ステータス.value)}44`,
                        background: `${statusColor(r.操作ステータス.value)}11`,
                      }}>
                        {r.操作ステータス.value}
                      </span>
                    ) : <span style={s.dash}>—</span>}
                  </td>
                  <td style={s.td}>
                    {r.Mode.value ? (
                      <span style={{
                        ...s.modeTag,
                        color: modeColor(r.Mode.value),
                        borderColor: `${modeColor(r.Mode.value)}44`,
                      }}>
                        {r.Mode.value === "Domestic transport" ? "Domestic" : r.Mode.value}
                      </span>
                    ) : <span style={s.dash}>—</span>}
                  </td>
                  <td style={{ ...s.td, fontSize: 11 }}>{fmtDate(r.ETD.value)}</td>
                  <td style={{ ...s.td, fontSize: 11 }}>{fmtDate(r.ETA.value)}</td>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11 }}>
                    {r.AWB_NO.value || "—"}
                  </td>
                  <td style={{ ...s.td, fontSize: 10, color: "var(--text-dim)" }}>
                    {fmtCreated(r.作成日時.value)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {loading && (
          <div style={s.loadingRow}>
            <span style={s.spinner}>⟳</span> データ取得中…
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div style={s.loadMoreWrap}>
          <button style={s.loadMoreBtn} onClick={loadMore}>
            さらに読み込む（+50件）
          </button>
        </div>
      )}

      <footer style={s.footer}>
        OPTEC · Kintone 案件列表查看器 · Powered by Kintone REST API
      </footer>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--dark)", paddingBottom: 48 },

  header: {
    background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "24px 32px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", color: "var(--gold)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 4, marginBottom: 10, textTransform: "uppercase",
  },
  title: { fontSize: 22, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 5 },
  subtitle: { fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.04em" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  countBadge: {
    fontSize: 12, color: "var(--gold)", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", padding: "5px 14px", borderRadius: 20,
  },
  refreshBtn: {
    background: "transparent", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 12, padding: "5px 14px", borderRadius: 6,
    cursor: "pointer", fontFamily: "inherit",
  },

  toolbar: {
    display: "flex", gap: 12, padding: "14px 32px",
    background: "var(--dark2)", borderBottom: "1px solid var(--border)",
    alignItems: "center", flexWrap: "wrap",
  },
  searchWrap: {
    position: "relative", flex: 1, minWidth: 260, maxWidth: 500,
    display: "flex", alignItems: "center",
  },
  searchIcon: { position: "absolute", left: 10, fontSize: 13, pointerEvents: "none" },
  searchInput: { paddingLeft: 32, paddingRight: 28, width: "100%" },
  clearBtn: {
    position: "absolute", right: 8, background: "transparent", border: "none",
    color: "var(--text-dim)", cursor: "pointer", fontSize: 12,
  },
  modeSelect: { width: 130 },

  statusBar: {
    display: "flex", gap: 6, padding: "10px 32px",
    background: "var(--dark2)", borderBottom: "1px solid var(--border)",
    flexWrap: "wrap",
  },
  statusBtn: {
    fontSize: 11, padding: "4px 12px", borderRadius: 16,
    border: "1px solid", cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.03em", transition: "all 0.15s",
  },

  errorBox: {
    margin: "12px 32px", padding: "10px 16px",
    background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
    borderRadius: 8, color: "#e05555", fontSize: 12,
  },

  tableWrap: {
    margin: "16px 32px 0",
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
  tr: { transition: "background 0.1s" },
  td: {
    padding: "9px 12px", borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)", verticalAlign: "middle",
    fontSize: 12, color: "var(--text)",
  },
  emptyCell: { textAlign: "center", padding: "40px", color: "var(--text-dim)", fontSize: 13 },

  caseNo: { fontFamily: "monospace", fontSize: 12, color: "var(--gold-light)", fontWeight: 700 },
  customer: { fontSize: 11, color: "var(--text)" },
  theme: { fontSize: 11, color: "var(--text-dim)" },
  dash: { color: "rgba(232,224,208,0.2)" },

  statusTag: {
    display: "inline-block", fontSize: 10, fontWeight: 700,
    padding: "2px 7px", borderRadius: 4, border: "1px solid",
    letterSpacing: "0.02em", whiteSpace: "nowrap",
  },
  modeTag: {
    display: "inline-block", fontSize: 10, fontWeight: 700,
    padding: "2px 7px", borderRadius: 4, border: "1px solid",
    letterSpacing: "0.04em",
  },

  loadingRow: {
    textAlign: "center", padding: "20px",
    color: "var(--text-dim)", fontSize: 13, letterSpacing: "0.06em",
  },
  spinner: { display: "inline-block", animation: "spin 1s linear infinite", marginRight: 8 },

  loadMoreWrap: { display: "flex", justifyContent: "center", padding: "20px 32px" },
  loadMoreBtn: {
    background: "rgba(201,169,110,0.08)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 12, padding: "8px 28px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.06em",
  },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 20,
  },
};
