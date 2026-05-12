"use client";

import { useState } from "react";

type FormData = { 姓名: string; 电话: string; 生日: string };
type Errors   = Partial<Record<keyof FormData, string>>;

const INIT: FormData = { 姓名: "", 电话: "", 生日: "" };

export default function SlackForm() {
  const [form, setForm]       = useState<FormData>(INIT);
  const [errors, setErrors]   = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ ok: boolean; id?: string; msg?: string } | null>(null);

  const set = (k: keyof FormData, v: string) => {
    setForm(prev => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
  };

  const validate = (): boolean => {
    const e: Errors = {};
    if (!form.姓名?.trim()) e.姓名 = "姓名は必須です";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ ok: true, id: data.id });
      setForm(INIT);
    } catch (e) {
      setResult({ ok: false, msg: String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · KINTONE + SLACK</div>
          <h1 style={s.title}>登録 & Slack 通知フォーム</h1>
          <p style={s.subtitle}>Kintone に登録後、Slack チャンネルへ自動通知します</p>
        </div>
        <div style={s.flowWrap}>
          {[
            { label: "① 入力",        color: "var(--gold)" },
            { label: "② Kintone 登録", color: "#60a5fa" },
            { label: "③ Slack 通知",   color: "#4A154B" },
          ].map((step, i) => (
            <div key={i} style={s.flowStep}>
              <span style={{ ...s.flowDot, background: step.color }} />
              <span style={s.flowLabel}>{step.label}</span>
              {i < 2 && <span style={s.flowArrow}>→</span>}
            </div>
          ))}
        </div>
      </header>

      <div style={s.body}>
        {/* Form */}
        <div style={s.formCard}>
          <div style={s.cardTitle}>📋 登録情報</div>

          <Field label="姓名" required error={errors.姓名}>
            <input
              className={errors.姓名 ? "error" : ""}
              value={form.姓名}
              placeholder="例：楊紫璇"
              onChange={e => set("姓名", e.target.value)}
            />
          </Field>

          <Field label="电话">
            <input
              value={form.电话}
              placeholder="例：090-1234-5678"
              onChange={e => set("电话", e.target.value)}
            />
          </Field>

          <Field label="生日">
            <input
              type="date"
              value={form.生日}
              onChange={e => set("生日", e.target.value)}
            />
          </Field>

          <button
            style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "⏳ 送信中…" : "🚀 登録 & Slack 通知"}
          </button>

          {Object.keys(errors).length > 0 && (
            <div style={s.errorBox}>
              {Object.values(errors).map((msg, i) => <div key={i}>⚠ {msg}</div>)}
            </div>
          )}

          {result?.ok && (
            <div style={s.successBox}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>✅ 登録・通知が完了しました！</div>
              <div>Kintone レコード ID: <strong>{result.id}</strong></div>
              <div style={{ marginTop: 4, fontSize: 11, color: "#a5d6a7" }}>
                Slack チャンネルに通知が送信されました 🔔
              </div>
            </div>
          )}
          {result?.ok === false && (
            <div style={s.errorBox}>⚠ エラー：{result.msg}</div>
          )}
        </div>

        {/* Info panel */}
        <div style={s.infoCard}>
          <div style={s.cardTitle}>🔔 Slack 通知内容</div>
          <div style={s.previewCard}>
            <div style={s.previewHeader}>📋 新規登録通知 | OPTEC</div>
            <div style={s.previewGrid}>
              <div style={s.previewItem}><span style={s.previewLabel}>姓名</span><span>（入力値）</span></div>
              <div style={s.previewItem}><span style={s.previewLabel}>电话</span><span>（入力値）</span></div>
              <div style={s.previewItem}><span style={s.previewLabel}>生日</span><span>（入力値）</span></div>
              <div style={s.previewItem}><span style={s.previewLabel}>レコード ID</span><span>（自動取得）</span></div>
            </div>
            <div style={s.previewFooter}>✅ Kintone App に登録完了 | 登録日時</div>
          </div>

          <div style={s.divider} />
          <div style={s.cardTitle}>⚡ 処理フロー</div>
          <ol style={s.stepList}>
            {[
              "必須項目バリデーション",
              "Kintone REST API へ POST",
              "レコード ID を取得",
              "Slack Incoming Webhook へ送信",
              "Block Kit 形式で通知表示",
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
        OPTEC · Kintone + Slack 通知フォーム · Powered by Kintone REST API &amp; Slack Webhooks
      </footer>
    </div>
  );
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.04em" }}>
        {label}
        {required && <span style={{ color: "var(--red)", marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "var(--red)" }}>{error}</span>}
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
  title:    { fontSize: 24, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 4 },
  subtitle: { fontSize: 12, color: "var(--text-dim)" },
  flowWrap: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", alignSelf: "center" },
  flowStep: { display: "flex", alignItems: "center", gap: 6 },
  flowDot:  { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  flowLabel: { fontSize: 12, color: "var(--text-dim)" },
  flowArrow: { fontSize: 12, color: "var(--border-strong)", marginLeft: 2 },

  body: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, padding: "24px 32px", alignItems: "start" },

  formCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
    display: "flex", flexDirection: "column", gap: 16,
  },
  infoCard: {
    background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: 24,
    display: "flex", flexDirection: "column", gap: 14, position: "sticky", top: 20,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" },
  divider:   { borderTop: "1px solid var(--border)", margin: "4px 0" },

  submitBtn: {
    background: "rgba(74,21,75,0.4)", border: "1px solid rgba(74,21,75,0.8)",
    color: "#e8d0e8", fontSize: 13, padding: "12px 20px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
    transition: "background 0.2s", width: "100%",
  },
  errorBox: {
    padding: "10px 16px", background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)", borderRadius: 8,
    color: "#e05555", fontSize: 12, lineHeight: 1.7,
  },
  successBox: {
    padding: "12px 16px", background: "rgba(76,175,80,0.1)",
    border: "1px solid rgba(76,175,80,0.3)", borderRadius: 8,
    color: "#4caf50", fontSize: 12, lineHeight: 1.7,
  },

  previewCard: {
    background: "rgba(74,21,75,0.15)", border: "1px solid rgba(74,21,75,0.4)",
    borderRadius: 8, overflow: "hidden",
  },
  previewHeader: {
    background: "rgba(74,21,75,0.4)", padding: "10px 14px",
    fontSize: 12, fontWeight: 700, color: "#e8d0e8",
  },
  previewGrid: { padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 },
  previewItem: { display: "flex", gap: 8, fontSize: 11, color: "var(--text-dim)" },
  previewLabel: { color: "#e8d0e8", fontWeight: 700, minWidth: 90 },
  previewFooter: {
    padding: "8px 14px", borderTop: "1px solid rgba(74,21,75,0.4)",
    fontSize: 10, color: "rgba(232,208,232,0.6)",
  },

  stepList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 10 },
  stepItem: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 },
  stepNum: {
    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
    background: "rgba(74,21,75,0.3)", border: "1px solid rgba(74,21,75,0.6)",
    color: "#e8d0e8", fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 24,
  },
};
