"use client";

import { useState } from "react";

type FormState = {
  発生日時:           string;
  報告問題:           string;
  報告者コード:       string;
  報告部署:           string;
  発生部署コード:     string;
  発生部署部長コード: string;
  NCR発生分類:        string;
  適用領域:           string;
  顧客苦情:           string;
  案件番号:           string;
  案件概要:           string;
};

type Result = {
  kintoneId: string;
  ncrNumber: string;
  folderUrl: string;
  docUrl:    string;
};

// Department → head email mapping (from existing Kintone records)
const DEPT_HEAD: Record<string, string> = {
  "OS課":               "luna@optec-exp.com",
  "GC室":               "luna@optec-exp.com",
  "総務課":             "yukikimura@optec-exp.com",
  "成田営業所（通関課）": "yusakuizumi@optec-exp.com",
};

const 発生部署OPTIONS: { code: string; label: string }[] = [
  { code: "OS課",               label: "OS課" },
  { code: "GC室",               label: "GC室" },
  { code: "総務課",             label: "総務課" },
  { code: "総務人事室",         label: "総務人事室" },
  { code: "成田営業所（通関課）", label: "成田営業所（通関課）" },
  { code: "業務課",             label: "業務課" },
  { code: "DX室（中国）",       label: "DX室（中国）" },
  { code: "中国Marketing",      label: "Marketing（中国）" },
  { code: "中国法人_CWqB8l",    label: "中国法人" },
  { code: "治理室_htkI1f",      label: "治理室" },
];

const 報告部署OPTIONS = [
  "OS","GC","TCC","通関課","物流開発室","DX","治理室",
  "Marketing","中国財務","中国総務","日本総務","日本営業課","管理課",
];

const 適用領域OPTIONS = [
  "情報セキュリティ(信息安全)","医薬品","航空機部品","展示会","その他",
];

const INIT: FormState = {
  発生日時:             "",
  報告問題:             "部門内",
  報告者コード:         "",
  報告部署:             "",
  発生部署コード:       "",
  発生部署部長コード:   "",
  NCR発生分類:          "内部起因",
  適用領域:             "",
  顧客苦情:             "否",
  案件番号:             "",
  案件概要:             "",
};

export default function NcrPage() {
  const [form, setForm]       = useState<FormState>(INIT);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<Result | null>(null);
  const [error, setError]     = useState("");

  const set = (k: keyof FormState, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const onDeptChange = (dept: string) => {
    const head = DEPT_HEAD[dept] ?? "";
    setForm(prev => ({ ...prev, 発生部署コード: dept, 発生部署部長コード: head }));
  };

  const validate = () => {
    if (!form.発生日時.trim())           return "発生日時を入力してください";
    if (!form.報告者コード.trim())       return "報告者（ログインコード）を入力してください";
    if (!form.発生部署コード.trim())     return "発生部署を選択してください";
    if (!form.発生部署部長コード.trim()) return "発生部署部長コードを入力してください";
    if (!form.案件概要.trim())           return "案件概要を入力してください";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      setForm(INIT);
    } catch (e) { setError(String(e)); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · NCR 自動登録</div>
          <h1 style={s.title}>NCR 登録システム</h1>
          <p style={s.subtitle}>NCR 登録 → Kintone 保存 → Slack 通知 → Drive フォルダ自動作成</p>
        </div>
        <div style={s.flowWrap}>
          {[
            { label: "① NCR 入力",     color: "var(--gold)" },
            { label: "② Kintone 保存", color: "var(--blue)" },
            { label: "③ Slack 通知",   color: "#f97316" },
            { label: "④ Drive 作成",   color: "var(--green)" },
          ].map((step, i) => (
            <div key={i} style={s.flowStep}>
              <span style={{ ...s.flowDot, background: step.color }} />
              <span style={s.flowLabel}>{step.label}</span>
              {i < 3 && <span style={s.flowArrow}>→</span>}
            </div>
          ))}
        </div>
      </header>

      <div style={s.body}>
        {result && (
          <div style={s.successCard}>
            <div style={s.successIcon}>✅</div>
            <div style={s.successTitle}>NCR 登録完了</div>
            <div style={s.successItems}>
              <div style={s.successItem}>
                <span style={s.successLabel}>NCR番号</span>
                <span style={s.successValue}>{result.ncrNumber}</span>
              </div>
              <div style={s.successItem}>
                <span style={s.successLabel}>Kintone レコード ID</span>
                <span style={s.successValue}>{result.kintoneId}</span>
              </div>
              <div style={s.successItem}>
                <span style={s.successLabel}>Drive フォルダ</span>
                <a href={result.folderUrl} target="_blank" rel="noreferrer" style={s.link}>フォルダを開く →</a>
              </div>
              {result.docUrl && (
                <div style={s.successItem}>
                  <span style={s.successLabel}>NCR 報告書</span>
                  <a href={result.docUrl} target="_blank" rel="noreferrer" style={s.link}>報告書を開く →</a>
                </div>
              )}
            </div>
            <div style={s.successNote}>担当者に Slack @mention で通知済みです</div>
          </div>
        )}

        <div style={s.formCard}>
          <div style={s.cardTitle}>📋 NCR 情報入力</div>

          <div style={s.grid2}>
            <Field label="発生日時 *">
              <input type="date" value={form.発生日時}
                onChange={e => set("発生日時", e.target.value)} />
            </Field>
            <Field label="報告部署">
              <select value={form.報告部署} onChange={e => set("報告部署", e.target.value)}>
                <option value="">— 選択 —</option>
                {報告部署OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <div style={s.grid2}>
            <Field label="報告者 *" hint="Kintone ログインコード（メールアドレス）">
              <input value={form.報告者コード}
                onChange={e => set("報告者コード", e.target.value)}
                placeholder="xxx@optec-exp.com" />
            </Field>
            <Field label="案件番号">
              <input value={form.案件番号}
                onChange={e => set("案件番号", e.target.value)}
                placeholder="任意" />
            </Field>
          </div>

          <div style={s.grid2}>
            <Field label="発生部署 *">
              <select value={form.発生部署コード} onChange={e => onDeptChange(e.target.value)}>
                <option value="">— 選択 —</option>
                {発生部署OPTIONS.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="発生部署部長 *" hint="自動入力・手動修正可">
              <input value={form.発生部署部長コード}
                onChange={e => set("発生部署部長コード", e.target.value)}
                placeholder="xxx@optec-exp.com" />
            </Field>
          </div>

          <div style={s.grid3}>
            <Field label="報告問題 *">
              <div style={s.radioGroup}>
                {["部門内","他の部門","--"].map(opt => (
                  <label key={opt} style={s.radioLabel}>
                    <input type="radio" name="報告問題" value={opt}
                      checked={form.報告問題 === opt}
                      onChange={() => set("報告問題", opt)}
                      style={{ width: "auto", marginRight: 5 }} />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="NCR 発生分類 *">
              <div style={s.radioGroup}>
                {["内部起因","顧客案件"].map(opt => (
                  <label key={opt} style={s.radioLabel}>
                    <input type="radio" name="NCR発生分類" value={opt}
                      checked={form.NCR発生分類 === opt}
                      onChange={() => set("NCR発生分類", opt)}
                      style={{ width: "auto", marginRight: 5 }} />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="顧客苦情 *">
              <div style={s.radioGroup}>
                {["是","否"].map(opt => (
                  <label key={opt} style={s.radioLabel}>
                    <input type="radio" name="顧客苦情" value={opt}
                      checked={form.顧客苦情 === opt}
                      onChange={() => set("顧客苦情", opt)}
                      style={{ width: "auto", marginRight: 5 }} />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          <Field label="適用領域">
            <select value={form.適用領域} onChange={e => set("適用領域", e.target.value)}
              style={{ maxWidth: 320 }}>
              <option value="">— 選択 —</option>
              {適用領域OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>

          <Field label="案件概要 *" hint="いつ／どこで／誰が／何が起きたか／影響">
            <textarea value={form.案件概要} onChange={e => set("案件概要", e.target.value)}
              placeholder="いつ／どこで／誰が（氏名を明記）／何が起きたか／影響"
              rows={5} style={{ resize: "vertical" }} />
          </Field>

          {error && <div style={s.errorBox}>⚠ {error}</div>}

          <button style={{ ...s.submitBtn, opacity: loading ? 0.7 : 1 }}
            onClick={submit} disabled={loading}>
            {loading ? "⏳ 登録処理中…" : "🚀 NCR 登録 · 通知 · Drive 作成"}
          </button>
        </div>

        <div style={s.infoCard}>
          <div style={s.cardTitle}>⚙ 自動処理の流れ</div>
          <div style={s.steps}>
            {[
              { icon: "📝", title: "Kintone 登録",         desc: "入力内容を Kintone App 1025 に保存。NCR番号は自動採番。" },
              { icon: "💬", title: "Slack @mention 通知",  desc: "発生部署責任者に @mention で即時アラート送信" },
              { icon: "📁", title: "Drive フォルダ作成",    desc: "NCR番号をフォルダ名として親フォルダ内に自動生成" },
              { icon: "📄", title: "報告書テンプレート作成", desc: "Google Doc として Drive フォルダ内に配置" },
            ].map((step, i) => (
              <div key={i} style={s.stepItem}>
                <span style={s.stepIcon}>{step.icon}</span>
                <div>
                  <div style={s.stepTitle}>{step.title}</div>
                  <div style={s.stepDesc}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer style={s.footer}>
        OPTEC · NCR 自動登録システム · Kintone + Slack + Google Drive
      </footer>
    </div>
  );
}

function Field({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.05em" }}>
        {label}
        {hint && <span style={{ fontWeight: 400, color: "var(--text-dim)", marginLeft: 8 }}>{hint}</span>}
      </label>
      {children}
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
  title:     { fontSize: 24, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 4 },
  subtitle:  { fontSize: 12, color: "var(--text-dim)" },
  flowWrap:  { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", alignSelf: "center" },
  flowStep:  { display: "flex", alignItems: "center", gap: 5 },
  flowDot:   { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  flowLabel: { fontSize: 11, color: "var(--text-dim)" },
  flowArrow: { fontSize: 11, color: "var(--border-strong)" },
  body: { display: "flex", flexDirection: "column", gap: 20, padding: "24px 32px" },
  successCard: {
    background: "rgba(76,175,80,0.08)", border: "1px solid rgba(76,175,80,0.3)",
    borderRadius: 12, padding: "24px 28px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 12,
  },
  successIcon:  { fontSize: 36 },
  successTitle: { fontSize: 16, fontWeight: 700, color: "var(--green)" },
  successItems: { display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 520 },
  successItem:  {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 14px", background: "rgba(255,255,255,0.04)", borderRadius: 8,
  },
  successLabel: { fontSize: 11, color: "var(--text-dim)" },
  successValue: { fontSize: 13, fontWeight: 700, color: "var(--text)" },
  successNote:  { fontSize: 11, color: "var(--text-dim)", marginTop: 4 },
  link: { fontSize: 13, color: "var(--blue)", textDecoration: "none", fontWeight: 600 },
  formCard: {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
    padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18,
  },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  radioGroup: { display: "flex", gap: 16, alignItems: "center", padding: "8px 0", flexWrap: "wrap" },
  radioLabel: { display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--text)", cursor: "pointer" },
  errorBox: {
    padding: "10px 16px", background: "rgba(224,85,85,0.1)",
    border: "1px solid rgba(224,85,85,0.3)", borderRadius: 8,
    color: "var(--red)", fontSize: 12,
  },
  submitBtn: {
    background: "linear-gradient(135deg,rgba(201,169,110,0.2),rgba(201,169,110,0.1))",
    border: "1px solid var(--border-strong)", color: "var(--gold-light)",
    fontSize: 14, fontWeight: 700, padding: "14px 0", borderRadius: 8,
    letterSpacing: "0.04em", transition: "opacity 0.2s",
  },
  infoCard: { background: "var(--card2)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 28px" },
  steps:     { display: "flex", flexDirection: "column", gap: 14, marginTop: 14 },
  stepItem:  { display: "flex", alignItems: "flex-start", gap: 14 },
  stepIcon:  { fontSize: 20, flexShrink: 0, marginTop: 1 },
  stepTitle: { fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 2 },
  stepDesc:  { fontSize: 11, color: "var(--text-dim)" },
  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.08em", padding: "16px 32px 0",
    borderTop: "1px solid var(--border)", marginTop: 24,
  },
};
