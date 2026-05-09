"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface NCRRecord {
  $id: { value: string };
  NCR番号: { value: string };
  発生日時: { value: string };
  NCR_発生分類: { value: string };
  ステータス: { value: string };
}

const COMPLETED_STATUSES = ["効果測定待ち", "効果測定中ing", "案件完了"];
const PIE_COLORS: Record<string, string> = {
  "顧客案件": "#60a5fa",
  "内部起因": "#f97316",
};
const PIE_FALLBACK = ["#a78bfa", "#4caf50", "#e05555", "#f59e0b"];

function fmtDateTime(s: string) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("ja-JP", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
}

// ─── Custom Tooltip for LineChart ──────────────────────────────────────────
function LineTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(201,169,110,0.35)", padding: "8px 14px", borderRadius: 8 }}>
      <p style={{ color: "#c9a96e", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{label}</p>
      <p style={{ color: "#e8e0d0", fontSize: 13 }}>{payload[0].value} 件</p>
    </div>
  );
}

// ─── Custom Tooltip for PieChart ───────────────────────────────────────────
function PieTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percent: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const pct = Math.round(payload[0].payload.percent * 100);
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(201,169,110,0.35)", padding: "8px 14px", borderRadius: 8 }}>
      <p style={{ color: "#c9a96e", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{name}</p>
      <p style={{ color: "#e8e0d0", fontSize: 13 }}>{value} 件（{pct}%）</p>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function NCRDashboard() {
  const [records, setRecords] = useState<NCRRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    fetch("/api/ncr")
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setRecords(d.records ?? []);
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // ── KPI ─────────────────────────────────────────────────────────────────
  const total = records.length;
  const unprocessedList = [...records.filter(r => r.ステータス.value === "未処理")]
    .sort((a, b) => a.発生日時.value.localeCompare(b.発生日時.value));
  const completedCount = records.filter(r => COMPLETED_STATUSES.includes(r.ステータス.value)).length;
  const completionRate = total > 0 ? Math.round(completedCount / total * 100) : 0;

  // ── Monthly Trend ────────────────────────────────────────────────────────
  const monthMap = new Map<string, number>();
  for (const r of records) {
    const d = r.発生日時.value;
    if (d) {
      const m = d.slice(0, 7); // "2026-01"
      monthMap.set(m, (monthMap.get(m) || 0) + 1);
    }
  }
  const trendData = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month: month.replace("-", "/"), count }));

  // ── Pie Classification ───────────────────────────────────────────────────
  const classMap = new Map<string, number>();
  for (const r of records) {
    const c = r.NCR_発生分類.value || "未分類";
    classMap.set(c, (classMap.get(c) || 0) + 1);
  }
  const pieData = Array.from(classMap.entries()).map(([name, value]) => ({ name, value }));
  let fallbackIdx = 0;
  const pieColor = (name: string) => PIE_COLORS[name] ?? PIE_FALLBACK[fallbackIdx++ % PIE_FALLBACK.length];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · KINTONE</div>
          <h1 style={s.title}>NCR 分析仪表盘</h1>
          <p style={s.subtitle}>月度趋势 · 分类饼图 · 未処理列表 · 纠正完成率</p>
        </div>
        <div style={s.headerRight}>
          {loading ? (
            <span style={s.loadingBadge}>データ取得中…</span>
          ) : (
            <span style={s.totalBadge}>総件数 {total} 件</span>
          )}
        </div>
      </header>

      {error && <div style={s.errorBox}>⚠ {error}</div>}

      {loading ? (
        <div style={s.center}><span style={s.spinner}>⟳</span> データ取得中…</div>
      ) : (
        <div style={s.body}>

          {/* ── KPI Cards ─────────────────────────────────────── */}
          <div style={s.kpiRow}>
            <div style={s.kpiCard}>
              <div style={s.kpiLabel}>総 NCR 件数</div>
              <div style={{ ...s.kpiValue, color: "var(--gold-light)" }}>{total}</div>
              <div style={s.kpiUnit}>件</div>
            </div>
            <div style={s.kpiCard}>
              <div style={s.kpiLabel}>未処理件数</div>
              <div style={{ ...s.kpiValue, color: "#e05555" }}>{unprocessedList.length}</div>
              <div style={s.kpiUnit}>件</div>
            </div>
            <div style={s.kpiCard}>
              <div style={s.kpiLabel}>纠正完成率</div>
              <div style={{ ...s.kpiValue, color: "#4caf50" }}>{completionRate}</div>
              <div style={s.kpiUnit}>%</div>
            </div>
            <div style={s.kpiCard}>
              <div style={s.kpiLabel}>完了件数</div>
              <div style={{ ...s.kpiValue, color: "#a78bfa" }}>{completedCount}</div>
              <div style={s.kpiUnit}>件</div>
            </div>
          </div>

          {/* ── Charts ────────────────────────────────────────── */}
          <div style={s.chartRow}>
            {/* Line Chart */}
            <div style={s.chartCard}>
              <div style={s.chartTitle}>📈 月度 NCR 件数趋势</div>
              {trendData.length === 0 ? (
                <div style={s.noData}>データなし</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,169,110,0.12)" />
                    <XAxis
                      dataKey="month"
                      tick={{ fill: "rgba(232,224,208,0.55)", fontSize: 11 }}
                      axisLine={{ stroke: "rgba(201,169,110,0.3)" }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "rgba(232,224,208,0.55)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<LineTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#c9a96e"
                      strokeWidth={2.5}
                      dot={{ fill: "#c9a96e", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "#e8c99a" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pie Chart */}
            <div style={s.chartCard}>
              <div style={s.chartTitle}>🥧 NCR 分类分布</div>
              {pieData.length === 0 ? (
                <div style={s.noData}>データなし</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: "rgba(232,224,208,0.3)" }}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={pieColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, color: "rgba(232,224,208,0.7)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Unprocessed List ──────────────────────────────── */}
          <div style={s.section}>
            <div style={s.sectionHeader}>
              <span style={s.sectionTitle}>⚠ 未処理 NCR 一覧</span>
              <span style={s.sectionBadge}>{unprocessedList.length} 件</span>
            </div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr style={s.thead}>
                    <th style={{ ...s.th, width: 70 }}>ID</th>
                    <th style={{ ...s.th, width: 180 }}>NCR 発生日時</th>
                    <th style={{ ...s.th, width: 140 }}>分類</th>
                    <th style={{ ...s.th, width: 100 }}>ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {unprocessedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={s.emptyCell}>未処理の案件はありません ✓</td>
                    </tr>
                  ) : (
                    unprocessedList.map((r, i) => (
                      <tr key={r.$id.value} style={{ ...s.tr, background: i % 2 === 0 ? "var(--card)" : "var(--card2)" }}>
                        <td style={s.td}>
                          <span style={s.idTag}>{r.NCR番号.value || r.$id.value}</span>
                        </td>
                        <td style={{ ...s.td, fontSize: 12 }}>{fmtDateTime(r.発生日時.value)}</td>
                        <td style={s.td}>
                          <span style={{
                            ...s.classTag,
                            color: PIE_COLORS[r.NCR_発生分類.value] ?? "var(--text-dim)",
                            borderColor: `${PIE_COLORS[r.NCR_発生分類.value] ?? "rgba(232,224,208,0.3)"}55`,
                          }}>
                            {r.NCR_発生分類.value || "—"}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={s.unprocessedTag}>未処理</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      <footer style={s.footer}>
        OPTEC · NCR 分析仪表盘 · Powered by Kintone REST API
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
  headerRight: { alignSelf: "center" },
  loadingBadge: { fontSize: 12, color: "var(--text-dim)" },
  totalBadge: {
    fontSize: 13, color: "var(--gold)", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", padding: "6px 18px", borderRadius: 20,
  },

  errorBox: {
    margin: "12px 32px", padding: "10px 16px",
    background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
    borderRadius: 8, color: "#e05555", fontSize: 12,
  },
  center: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 10, padding: "80px 32px", color: "var(--text-dim)", fontSize: 14,
  },
  spinner: { fontSize: 20, display: "inline-block" },

  body: { padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 },

  // KPI cards
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16 },
  kpiCard: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 24px",
    display: "flex", flexDirection: "column", gap: 4,
  },
  kpiLabel: { fontSize: 11, color: "var(--text-dim)", letterSpacing: "0.06em" },
  kpiValue: { fontSize: 40, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" },
  kpiUnit: { fontSize: 13, color: "var(--text-dim)" },

  // Charts
  chartRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  chartCard: {
    background: "var(--card)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "20px 20px 16px",
  },
  chartTitle: { fontSize: 13, fontWeight: 700, color: "var(--gold)", marginBottom: 16, letterSpacing: "0.04em" },
  noData: { height: 260, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 13 },

  // Section
  section: { display: "flex", flexDirection: "column", gap: 12 },
  sectionHeader: { display: "flex", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: "var(--gold-light)" },
  sectionBadge: {
    fontSize: 11, color: "#e05555", background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)", padding: "2px 10px", borderRadius: 12,
  },

  // Table
  tableWrap: {
    border: "1px solid var(--border)", borderRadius: 10,
    overflow: "auto", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  thead: { background: "var(--dark2)" },
  th: {
    padding: "10px 14px", fontSize: 11, fontWeight: 700,
    color: "var(--gold)", letterSpacing: "0.06em", textAlign: "left",
    borderBottom: "2px solid var(--border-strong)",
    borderRight: "1px solid var(--border)", whiteSpace: "nowrap",
  },
  tr: {},
  td: {
    padding: "10px 14px", borderBottom: "1px solid var(--border)",
    borderRight: "1px solid var(--border)", verticalAlign: "middle",
    fontSize: 12, color: "var(--text)",
  },
  emptyCell: { textAlign: "center", padding: "30px", color: "var(--text-dim)", fontSize: 13 },
  idTag: { fontFamily: "monospace", fontSize: 12, color: "var(--text-dim)" },
  classTag: {
    display: "inline-block", fontSize: 11, fontWeight: 700,
    padding: "2px 8px", borderRadius: 4, border: "1px solid",
  },
  unprocessedTag: {
    display: "inline-block", fontSize: 11, fontWeight: 700,
    padding: "2px 8px", borderRadius: 4,
    color: "#e05555", background: "rgba(224,85,85,0.1)", border: "1px solid rgba(224,85,85,0.3)",
  },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 20,
  },
};
