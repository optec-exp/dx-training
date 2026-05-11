"use client";

import { useState, useEffect, useCallback } from "react";

type Row = string[];

const CATEGORIES = ["貨物遅延", "書類不備", "顧客問い合わせ", "内部連絡", "その他"];
const STATUS_COLORS: Record<string, string> = {
  "未対応": "#e05555",
  "対応中": "#f97316",
  "完了":   "#4caf50",
};

const today = () => new Date().toISOString().slice(0, 10).replace(/-/g, "/");

export default function SheetsPage() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [headers, setHeaders] = useState<Row>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    日付: today(), 顧客名: "", AWB番号: "", カテゴリ: CATEGORIES[0], 内容: "", ステータス: "未対応",
  });

  const fetchRows = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/sheets");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const all: Row[] = data.rows ?? [];
      if (all.length > 0) { setHeaders(all[0]); setRows(all.slice(1)); }
      else { setHeaders([]); setRows([]); }
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleChange = (k: string, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.顧客名.trim() || !form.内容.trim()) {
      setError("顧客名と内容は必須です"); return;
    }
    setSubmitting(true); setError(""); setSuccess(false);
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setForm({ 日付: today(), 顧客名: "", AWB番号: "", カテゴリ: CATEGORIES[0], 内容: "", ステータス: "未対応" });
      await fetchRows();
    } catch (e) { setError(String(e)); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · GOOGLE SHEETS</div>
          <h1 style={s.title}>業務ログ管理</h1>
          <p style={s.subtitle}>Google Spreadsheet を簡易 DB として読み書きする</p>
        </div>
        <div style={s.kpiRow}>
          <div style={s.kpi}><span style={s.kpiNum}>{rows.length}</span><span style={s.kpiLabel}>総件数</span></div>
          <div style={s.kpi}>
            <span style={{ ...s.kpiNum, color: "#e05555" }}>
              {rows.filter(r => r[5] === "未対応").length}
            </span>
            <span style={s.kpiLabel}>未対応</span>
          </div>
          <div style={s.kpi}>
            <span style={{ ...s.kpiNum, color: "#4caf50" }}>
              {rows.filter(r => r[5] === "完了").length}
            </span>
            <span style={s.kpiLabel}>完了</span>
          </div>
        </div>
      </header>

      <div style={s.body}>
        {/* Left: Form */}
        <div style={s.formCard}>
          <div style={s.cardTitle}>📝 新規エントリー追加</div>

          {[
            { key: "日付",   label: "日付",   type: "text" },
            { key: "顧客名", label: "顧客名 *", type: "text" },
            { key: "AWB番号", label: "AWB番号", type: "text" },
          ].map(f => (
            <div key={f.key} style={s.fieldGroup}>
              <label style={s.label}>{f.label}</label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={e => handleChange(f.key, e.target.value)}
                placeholder={f.key === "日付" ? "2026/05/11" : f.key === "顧客名" ? "例：株式会社○○" : "例：235-12345678"}
              />
            </div>
          ))}

          <div style={s.fieldGroup}>
            <label style={s.label}>カテゴリ</label>
            <select value={form.カテゴリ} onChange={e => handleChange("カテゴリ", e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>内容 *</label>
            <textarea
              rows={4}
              value={form.内容}
              placeholder="詳細内容を入力してください…"
              onChange={e => handleChange("内容", e.target.value)}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>ステータス</label>
            <select value={form.ステータス} onChange={e => handleChange("ステータス", e.target.value)}>
              {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <button
            style={{ ...s.submitBtn, opacity: submitting ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "⏳ 送信中…" : "➕ Sheets に追加"}
          </button>

          {error   && <div style={s.errorBox}>⚠ {error}</div>}
          {success && <div style={s.successBox}>✅ Sheets に追加しました！</div>}
        </div>

        {/* Right: Table */}
        <div style={s.tableCard}>
          <div style={s.tableHeader}>
            <div style={s.cardTitle}>📊 ログ一覧</div>
            <button style={s.refreshBtn} onClick={fetchRows} disabled={loading}>
              {loading ? "読込中…" : "↻ 更新"}
            </button>
          </div>

          {rows.length === 0 && !loading ? (
            <div style={s.empty}>データがありません</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {(headers.length > 0 ? headers : ["日付","顧客名","AWB番号","カテゴリ","内容","ステータス"]).map((h, i) => (
                      <th key={i} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri} style={ri % 2 === 0 ? s.trEven : s.trOdd}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={ci === 5 ? { ...s.td, ...s.tdStatus } : s.td}>
                          {ci === 5 ? (
                            <span style={{ ...s.statusBadge, background: `${STATUS_COLORS[cell] ?? "#666"}22`, color: STATUS_COLORS[cell] ?? "#aaa", border: `1px solid ${STATUS_COLORS[cell] ?? "#666"}55` }}>
                              {cell}
                            </span>
                          ) : ci === 4 ? (
                            <span style={s.contentCell}>{cell}</span>
                          ) : cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <footer style={s.footer}>
        OPTEC · Google Sheets 業務ログ管理 · Powered by Google Sheets API
      </footer>
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

  kpiRow: { display: "flex", gap: 20, alignSelf: "center", flexWrap: "wrap" },
  kpi: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  kpiNum: { fontSize: 28, fontWeight: 700, color: "var(--gold)", lineHeight: 1 },
  kpiLabel: { fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.06em" },

  body: { display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, padding: "24px 32px", alignItems: "start" },

  formCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
    display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20,
  },
  tableCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
    display: "flex", flexDirection: "column", gap: 16,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" },
  tableHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },

  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.04em" },

  submitBtn: {
    background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 13, padding: "10px 20px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    transition: "background 0.2s",
  },
  refreshBtn: {
    background: "transparent", border: "1px solid var(--border)",
    color: "var(--text-dim)", fontSize: 11, padding: "6px 14px",
    borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
  },

  errorBox: {
    padding: "10px 16px", background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)", borderRadius: 8,
    color: "#e05555", fontSize: 12, lineHeight: 1.5,
  },
  successBox: {
    padding: "10px 16px", background: "rgba(76,175,80,0.1)",
    border: "1px solid rgba(76,175,80,0.3)", borderRadius: 8,
    color: "#4caf50", fontSize: 12,
  },
  empty: { color: "var(--text-dim)", fontSize: 13, textAlign: "center", padding: "32px 0" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  th: {
    padding: "10px 12px", textAlign: "left",
    background: "rgba(201,169,110,0.08)", color: "var(--gold)",
    borderBottom: "1px solid var(--border)", fontWeight: 700,
    whiteSpace: "nowrap",
  },
  td: { padding: "9px 12px", borderBottom: "1px solid var(--border)", color: "var(--text)", verticalAlign: "top" },
  tdStatus: { whiteSpace: "nowrap" },
  trEven: { background: "transparent" },
  trOdd: { background: "rgba(255,255,255,0.02)" },
  statusBadge: {
    display: "inline-block", fontSize: 11, fontWeight: 700,
    padding: "2px 8px", borderRadius: 4,
  },
  contentCell: { display: "block", maxWidth: 300, whiteSpace: "pre-wrap", lineHeight: 1.6 },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 24,
  },
};
