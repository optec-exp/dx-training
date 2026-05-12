"use client";

import { useState } from "react";

const FIELDS = [
  { key: "顧客名",   label: "顧客名",   placeholder: "例：株式会社○○",          type: "text" },
  { key: "案件番号", label: "案件番号", placeholder: "例：OPT2601234",           type: "text" },
  { key: "日付",     label: "日付",     placeholder: "例：2026年05月10日",        type: "text" },
  { key: "担当者名", label: "担当者名", placeholder: "例：楊紫璇",                type: "text" },
  { key: "AWB番号",  label: "AWB番号",  placeholder: "例：235-12345678",          type: "text" },
  { key: "件名",     label: "件名",     placeholder: "例：貨物遅延のご報告",      type: "text" },
  { key: "内容",     label: "内容",     placeholder: "詳細内容を入力してください…", type: "textarea" },
];

export default function GoogleDocGenerator() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map(f => [f.key, ""]))
  );
  const [docTitle, setDocTitle] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  const handleChange = (key: string, val: string) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const handleGenerate = async () => {
    setLoading(true); setError(""); setDone(false);
    try {
      const title = docTitle.trim() || `OPTEC_文書_${new Date().toISOString().slice(0, 10)}`;
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replacements: values, title }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ドキュメント生成に失敗しました");
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${title}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setValues(Object.fromEntries(FIELDS.map(f => [f.key, ""])));
    setDocTitle(""); setError(""); setDone(false);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · GOOGLE DOCS</div>
          <h1 style={s.title}>文档自动生成</h1>
          <p style={s.subtitle}>输入数据 → 替换模板占位符 → 一键导出 PDF</p>
        </div>
        <div style={s.flowWrap}>
          {["① 填写数据", "② 生成文档", "③ 下载 PDF"].map((step, i) => (
            <div key={i} style={s.flowStep}>
              <span style={{ ...s.flowDot, background: i === 0 ? "var(--gold)" : i === 1 ? "#60a5fa" : "#4caf50" }} />
              <span style={s.flowLabel}>{step}</span>
              {i < 2 && <span style={s.flowArrow}>→</span>}
            </div>
          ))}
        </div>
      </header>

      <div style={s.body}>
        {/* Left: Form */}
        <div style={s.formCard}>
          <div style={s.cardTitle}>📝 入力フォーム</div>
          <p style={s.cardDesc}>
            テンプレートの <code style={s.code}>{"{{占位符}}"}</code> に対応する値を入力してください
          </p>

          {/* Document title */}
          <div style={s.fieldGroup}>
            <label style={s.label}>ドキュメント名（任意）</label>
            <input
              type="text"
              value={docTitle}
              placeholder="例：OPTEC_顧客報告書_2026"
              onChange={e => setDocTitle(e.target.value)}
            />
          </div>

          <div style={s.divider} />

          {/* Placeholder fields */}
          {FIELDS.map(f => (
            <div key={f.key} style={s.fieldGroup}>
              <label style={s.label}>
                {f.label}
                <span style={s.placeholder}>{`  →  {{${f.key}}}`}</span>
              </label>
              {f.type === "textarea" ? (
                <textarea
                  rows={4}
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => handleChange(f.key, e.target.value)}
                  style={{ resize: "vertical" }}
                />
              ) : (
                <input
                  type="text"
                  value={values[f.key]}
                  placeholder={f.placeholder}
                  onChange={e => handleChange(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          {/* Buttons */}
          <div style={s.btnRow}>
            <button
              style={{ ...s.generateBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "⏳ 生成中…" : "📄 生成 & 下载 PDF"}
            </button>
            <button style={s.resetBtn} onClick={handleReset} disabled={loading}>
              ✕ リセット
            </button>
          </div>

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          {done && (
            <div style={s.successBox}>
              ✅ PDF の生成・ダウンロードが完了しました！
            </div>
          )}
        </div>

        {/* Right: Instructions */}
        <div style={s.infoCard}>
          <div style={s.cardTitle}>📋 テンプレートの使い方</div>
          <p style={s.infoText}>
            Google ドキュメントのテンプレートに以下の占位符を記入しておくと、
            フォームの入力値で自動的に置き換えられます。
          </p>
          <div style={s.placeholderList}>
            {FIELDS.map(f => (
              <div key={f.key} style={s.placeholderRow}>
                <code style={s.codeTag}>{`{{${f.key}}}`}</code>
                <span style={s.arrowGray}>→</span>
                <span style={s.placeholderDesc}>{f.label}</span>
              </div>
            ))}
          </div>

          <div style={s.divider} />
          <div style={s.cardTitle}>⚙ 処理フロー</div>
          <ol style={s.stepList}>
            {[
              "テンプレート Google Doc をコピー",
              "全占位符を入力値に一括置換",
              "PDF としてエクスポート",
              "一時ファイルを自動削除",
              "PDF をブラウザにダウンロード",
            ].map((step, i) => (
              <li key={i} style={s.stepItem}>
                <span style={s.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <footer style={s.footer}>
        OPTEC · Google Docs 文档自动生成 · Powered by Google Docs API
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
  flowWrap: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", alignSelf: "center" },
  flowStep: { display: "flex", alignItems: "center", gap: 6 },
  flowDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  flowLabel: { fontSize: 12, color: "var(--text-dim)" },
  flowArrow: { fontSize: 12, color: "var(--border-strong)", marginLeft: 2 },

  body: {
    display: "grid", gridTemplateColumns: "1fr 360px", gap: 24,
    padding: "24px 32px", alignItems: "start",
  },

  formCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px",
    display: "flex", flexDirection: "column", gap: 14,
  },
  infoCard: {
    background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px",
    display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" },
  cardDesc: { fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 },
  code: {
    fontFamily: "monospace", fontSize: 12, background: "rgba(201,169,110,0.1)",
    color: "var(--gold-light)", padding: "1px 6px", borderRadius: 4,
  },
  divider: { borderTop: "1px solid var(--border)", margin: "4px 0" },

  fieldGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.04em" },
  placeholder: { fontSize: 11, color: "var(--gold)", fontFamily: "monospace", opacity: 0.8 },

  btnRow: { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 },
  generateBtn: {
    flex: 1, background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 13, padding: "10px 20px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    transition: "background 0.2s",
  },
  resetBtn: {
    background: "transparent", border: "1px solid var(--border)",
    color: "var(--text-dim)", fontSize: 12, padding: "10px 16px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
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

  infoText: { fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7 },
  placeholderList: { display: "flex", flexDirection: "column", gap: 8 },
  placeholderRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  codeTag: {
    fontFamily: "monospace", fontSize: 11, background: "rgba(201,169,110,0.1)",
    color: "var(--gold-light)", padding: "2px 7px", borderRadius: 4, border: "1px solid var(--border)",
  },
  arrowGray: { fontSize: 11, color: "var(--border-strong)" },
  placeholderDesc: { fontSize: 11, color: "var(--text-dim)" },

  stepList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 10 },
  stepItem: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 },
  stepNum: {
    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
    background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 24,
  },
};
