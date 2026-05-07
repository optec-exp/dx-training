"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { use } from "react";

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
  return new Date(s).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function ClientDetail({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = use(params);
  const customerName = decodeURIComponent(encodedName);

  const [records, setRecords] = useState<KintoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchRecords = useCallback(async (off: number, append = false) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ customer: customerName, offset: String(off) });
      const res = await fetch(`/api/records?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "API error");
      const recs: KintoneRecord[] = data.records ?? [];
      setRecords(prev => append ? [...prev, ...recs] : recs);
      setHasMore(recs.length === 50);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [customerName]);

  useEffect(() => { fetchRecords(0); }, [fetchRecords]);

  const loadMore = () => {
    const next = offset + 50;
    setOffset(next);
    fetchRecords(next, true);
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div style={s.headerLeft}>
          <Link href="/" style={s.backBtn}>← 客户列表</Link>
          <div>
            <div style={s.badge}>OPTEC · KINTONE</div>
            <h1 style={s.title}>{customerName}</h1>
            <p style={s.subtitle}>案件历史详情</p>
          </div>
        </div>
        <div style={s.countBadge}>
          {loading && records.length === 0 ? "読み込み中…" : `${records.length} 件表示`}
        </div>
      </header>

      {error && <div style={s.errorBox}>⚠ {error}</div>}

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={s.thead}>
              <th style={{ ...s.th, width: 130 }}>案件番号</th>
              <th style={{ ...s.th, minWidth: 260 }}>案件テーマ</th>
              <th style={{ ...s.th, width: 150 }}>操作ステータス</th>
              <th style={{ ...s.th, width: 90 }}>Mode</th>
              <th style={{ ...s.th, width: 100 }}>ETD</th>
              <th style={{ ...s.th, width: 100 }}>ETA</th>
              <th style={{ ...s.th, width: 140 }}>AWB</th>
              <th style={{ ...s.th, width: 90 }}>登録日時</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && !loading ? (
              <tr>
                <td colSpan={8} style={s.emptyCell}>
                  {error ? "エラーが発生しました" : "案件データがありません"}
                </td>
              </tr>
            ) : (
              records.map((r, i) => (
                <tr key={r.$id.value} style={{ ...s.tr, background: i % 2 === 0 ? "var(--card)" : "var(--card2)" }}>
                  <td style={s.td}>
                    <span style={s.caseNo}>{r.当社案件番号.value || "—"}</span>
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
                      }}>{r.操作ステータス.value}</span>
                    ) : <span style={s.dash}>—</span>}
                  </td>
                  <td style={s.td}>
                    {r.Mode.value ? (
                      <span style={{
                        ...s.modeTag,
                        color: modeColor(r.Mode.value),
                        borderColor: `${modeColor(r.Mode.value)}44`,
                      }}>{r.Mode.value === "Domestic transport" ? "Domestic" : r.Mode.value}</span>
                    ) : <span style={s.dash}>—</span>}
                  </td>
                  <td style={{ ...s.td, fontSize: 11 }}>{fmtDate(r.ETD.value)}</td>
                  <td style={{ ...s.td, fontSize: 11 }}>{fmtDate(r.ETA.value)}</td>
                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11 }}>{r.AWB_NO.value || "—"}</td>
                  <td style={{ ...s.td, fontSize: 10, color: "var(--text-dim)" }}>{fmtCreated(r.作成日時.value)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {loading && (
          <div style={s.loadingRow}>データ取得中…</div>
        )}
      </div>

      {hasMore && !loading && (
        <div style={s.loadMoreWrap}>
          <button style={s.loadMoreBtn} onClick={loadMore}>さらに読み込む（+50件）</button>
        </div>
      )}

      <footer style={s.footer}>OPTEC · 客户详情 · Powered by Kintone REST API</footer>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--dark)", paddingBottom: 48 },
  header: {
    background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "20px 32px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
  },
  headerLeft: { display: "flex", flexDirection: "column", gap: 10 },
  backBtn: {
    display: "inline-block", fontSize: 12, color: "var(--gold)",
    background: "rgba(201,169,110,0.1)", border: "1px solid var(--border)",
    padding: "4px 12px", borderRadius: 6, textDecoration: "none",
    letterSpacing: "0.04em",
  },
  badge: {
    display: "inline-block", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", color: "var(--gold)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 4, marginBottom: 6, textTransform: "uppercase",
  },
  title: { fontSize: 20, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.02em", marginBottom: 3 },
  subtitle: { fontSize: 11, color: "var(--text-dim)" },
  countBadge: {
    fontSize: 12, color: "var(--gold)", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", padding: "6px 16px", borderRadius: 20, alignSelf: "center",
  },
  errorBox: {
    margin: "12px 32px", padding: "10px 16px",
    background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
    borderRadius: 8, color: "#e05555", fontSize: 12,
  },
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
  tr: { transition: "background 0.1s" },
  td: {
    padding: "9px 12px", borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)", verticalAlign: "middle",
    fontSize: 12, color: "var(--text)",
  },
  emptyCell: { textAlign: "center", padding: "40px", color: "var(--text-dim)", fontSize: 13 },
  caseNo: { fontFamily: "monospace", fontSize: 12, color: "var(--gold-light)", fontWeight: 700 },
  theme: { fontSize: 11, color: "var(--text-dim)" },
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
