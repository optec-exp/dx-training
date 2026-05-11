"use client";

import { useState } from "react";

type FormData = { 姓名: string; 电话: string; 生日: string };
type Errors   = Partial<Record<keyof FormData, string>>;

const INIT: FormData = { 姓名: "", 电话: "", 生日: "" };

export default function KintoneForm() {
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

  const handleReset = () => { setForm(INIT); setErrors({}); setResult(null); };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · KINTONE</div>
          <h1 style={s.title}>新規登録フォーム</h1>
          <p style={s.subtitle}>フォームに入力して Kintone に直接登録できます</p>
        </div>
        <div style={s.flowWrap}>
          {["① 入力", "② 検証", "③ Kintone 登録"].map((step, i) => (
            <div key={i} style={s.flowStep}>
              <span style={{ ...s.flowDot, background: i === 0 ? "var(--gold)" : i === 1 ? "#60a5fa" : "#4caf50" }} />
              <span style={s.flowLabel}>{step}</span>
              {i < 2 && <span style={s.flowArrow}>→</span>}
            </div>
          ))}
        </div>
      </header>

      <div style={s.body}>
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

          <div style={s.btnRow}>
            <button
              style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "⏳ 登録中…" : "✅ Kintone に登録"}
            </button>
            <button style={s.resetBtn} onClick={handleReset} disabled={loading}>
              ✕ リセット
            </button>
          </div>

          {Object.keys(errors).length > 0 && (
            <div style={s.errorBox}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>⚠ 入力内容を確認してください</div>
              {Object.values(errors).map((msg, i) => <div key={i}>・{msg}</div>)}
            </div>
          )}

          {result?.ok && (
            <div style={s.successBox}>
              ✅ Kintone への登録が完了しました！（レコード ID: {result.id}）
            </div>
          )}
          {result?.ok === false && (
            <div style={s.errorBox}>⚠ 登録に失敗しました：{result.msg}</div>
          )}
        </div>

        <div style={s.infoCard}>
          <div style={s.cardTitle}>📌 入力ガイド</div>
          <div style={s.guideList}>
            {[
              { field: "姓名 *", desc: "氏名を入力（必須）" },
              { field: "电话",   desc: "連絡先電話番号（任意）" },
              { field: "生日",   desc: "生年月日を選択（任意）" },
            ].map((g, i) => (
              <div key={i} style={s.guideRow}>
                <span style={s.guideField}>{g.field}</span>
                <span style={s.guideDesc}>{g.desc}</span>
              </div>
            ))}
          </div>

          <div style={s.divider} />
          <div style={s.cardTitle}>⚡ 処理フロー</div>
          <ol style={s.stepList}>
            {[
              "必須項目（*）のバリデーション",
              "Next.js API ルートへ送信",
              "Kintone REST API を呼び出し",
              "レコード ID を受け取り表示",
            ].map((step, i) => (
              <li key={i} style={s.stepItem}>
                <span style={s.stepNum}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <div style={s.divider} />
          <div style={s.noteBox}>
            <span style={{ color: "var(--gold)", fontWeight: 700 }}>* </span>
            マークの項目は必須入力です
          </div>
        </div>
      </div>

      <footer style={s.footer}>
        OPTEC · Kintone 登録フォーム · Powered by Kintone REST API
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

  body: { display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, padding: "24px 32px", alignItems: "start" },
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

  btnRow:    { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 },
  submitBtn: {
    flex: 1, background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 13, padding: "10px 20px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontWeight: 700,
  },
  resetBtn: {
    background: "transparent", border: "1px solid var(--border)",
    color: "var(--text-dim)", fontSize: 12, padding: "10px 16px",
    borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
  },
  errorBox: {
    padding: "10px 16px", background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)", borderRadius: 8,
    color: "#e05555", fontSize: 12, lineHeight: 1.7,
  },
  successBox: {
    padding: "10px 16px", background: "rgba(76,175,80,0.1)",
    border: "1px solid rgba(76,175,80,0.3)", borderRadius: 8,
    color: "#4caf50", fontSize: 12,
  },
  guideList: { display: "flex", flexDirection: "column", gap: 10 },
  guideRow:  { display: "flex", flexDirection: "column", gap: 2 },
  guideField: { fontSize: 12, color: "var(--gold-light)", fontWeight: 700 },
  guideDesc:  { fontSize: 11, color: "var(--text-dim)", lineHeight: 1.5 },
  stepList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 10 },
  stepItem: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 },
  stepNum: {
    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
    background: "rgba(201,169,110,0.15)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 10, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  noteBox: { fontSize: 11, color: "var(--text-dim)", lineHeight: 1.6 },
  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 24,
  },
};
