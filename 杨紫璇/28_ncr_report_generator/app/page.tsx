"use client";

import { useState, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormData {
  ncrNo: string;
  customerName: string;
  awb: string;
  date: string;
  location: string;
  incidentType: string;
  details: string;
  actions: string;
  rootCause: string;
  dept: string;
  capaDate: string;
  iso: string;
}

interface Reports {
  customerZH: string; customerJA: string; customerEN: string;
  auditZH: string;    auditJA: string;    auditEN: string;
}

// ─── Polite-type mapping (customer-facing) ────────────────────────────────────
const POLITE: Record<string, { zh: string; ja: string; en: string }> = {
  "货物破损":  { zh: "货物外观状态出现偏差",       ja: "貨物の外観状態に偏差が発生",               en: "a cargo condition deviation" },
  "运输延误":  { zh: "运输时效出现偏差",           ja: "輸送スケジュールに遅延が発生",             en: "a transit time deviation" },
  "货物遗失":  { zh: "货物未能如期交付",           ja: "貨物が予定通りに届かない事象",             en: "a delivery exception" },
  "温控超标":  { zh: "运输环境条件出现偏差",       ja: "輸送環境条件に偏差が発生",                 en: "a temperature control deviation" },
  "单据错误":  { zh: "运输文件信息出现偏差",       ja: "輸送書類に情報の偏差が発生",               en: "a documentation discrepancy" },
  "数量差异":  { zh: "货物数量出现差异",           ja: "貨物数量に差異が発生",                     en: "a quantity discrepancy" },
  "标签错误":  { zh: "货物标识信息出现偏差",       ja: "貨物ラベル情報に偏差が発生",               en: "a labeling discrepancy" },
  "其他":      { zh: "服务品质出现偏差",           ja: "サービス品質に偏差が発生",                 en: "a service quality deviation" },
};

// ─── Template generators ──────────────────────────────────────────────────────
function genCustomerZH(f: FormData) {
  const pt = POLITE[f.incidentType]?.zh ?? "服务品质出现偏差";
  return `【货物异常通知】

尊敬的 ${f.customerName} 客户：

感谢您一直以来对我司的信任与支持。

就提单号 ${f.awb} 的货物，于 ${f.date} 在 ${f.location} 出现了${pt}的情况。

事件说明：
${f.details}

我司已立即采取以下处理措施：
${f.actions}

我司将以此为契机，持续改进操作规程，确保类似情况不再发生，并为您提供更优质的服务。

如有任何疑问，敬请随时与我司联系。

谨此致歉，
OPTEC 品质管理部
${f.date}`;
}

function genCustomerJA(f: FormData) {
  const pt = POLITE[f.incidentType]?.ja ?? "サービス品質に偏差が発生";
  return `【貨物異常通知】

${f.customerName} 様

平素より格別のご愛顧を賜り、厚く御礼申し上げます。

ご依頼いただきました AWB番号 ${f.awb} の貨物につきまして、${f.date} に ${f.location} にて${pt}いたしましたことをお知らせいたします。

詳細内容：
${f.details}

弊社では直ちに以下の対応を実施いたしました：
${f.actions}

今後このような事態が再発しないよう、業務プロセスの改善に努めてまいります。ご迷惑をおかけしたことを深くお詫び申し上げます。

ご不明な点がございましたら、お気軽にお問い合わせください。

誠に申し訳ございませんでした。
OPTEC 品質管理部
${f.date}`;
}

function genCustomerEN(f: FormData) {
  const pt = POLITE[f.incidentType]?.en ?? "a service quality deviation";
  return `[Cargo Incident Notification]

Dear ${f.customerName},

Thank you for your continued trust and support.

We are writing to inform you that ${pt} has occurred with shipment AWB ${f.awb} on ${f.date} at ${f.location}.

Incident Details:
${f.details}

Immediate Actions Taken:
${f.actions}

We sincerely apologize for any inconvenience this may have caused. We are committed to continuously improving our processes to prevent similar occurrences and to provide you with the highest level of service.

Please do not hesitate to contact us should you have any questions.

Sincerely,
OPTEC Quality Management Department
${f.date}`;
}

function genAuditZH(f: FormData) {
  return `【NCR 不符合报告】

NCR 编号：${f.ncrNo}
填报日期：${f.date}

━━━━━━━━━━━━━━━━━━━━
一、基本信息
━━━━━━━━━━━━━━━━━━━━
提单号（AWB）：${f.awb}
客户名称：${f.customerName}
发生日期：${f.date}
发生地点：${f.location}
异常类型：${f.incidentType}

━━━━━━━━━━━━━━━━━━━━
二、异常详情
━━━━━━━━━━━━━━━━━━━━
${f.details}

━━━━━━━━━━━━━━━━━━━━
三、已采取措施
━━━━━━━━━━━━━━━━━━━━
${f.actions}

━━━━━━━━━━━━━━━━━━━━
四、根本原因分析
━━━━━━━━━━━━━━━━━━━━
${f.rootCause}

━━━━━━━━━━━━━━━━━━━━
五、纠正预防措施（CAPA）
━━━━━━━━━━━━━━━━━━━━
责任部门 / 责任人：${f.dept}
CAPA 完成截止日：${f.capaDate}
ISO 条款对应：${f.iso || "—"}

━━━━━━━━━━━━━━━━━━━━
记录人：品质管理部`;
}

function genAuditJA(f: FormData) {
  return `【NCR 不適合報告書】

NCR 番号：${f.ncrNo}
記録日：${f.date}

━━━━━━━━━━━━━━━━━━━━
1. 基本情報
━━━━━━━━━━━━━━━━━━━━
AWB 番号：${f.awb}
顧客名：${f.customerName}
発生日：${f.date}
発生場所：${f.location}
異常種別：${f.incidentType}

━━━━━━━━━━━━━━━━━━━━
2. 異常内容
━━━━━━━━━━━━━━━━━━━━
${f.details}

━━━━━━━━━━━━━━━━━━━━
3. 実施済み対応措置
━━━━━━━━━━━━━━━━━━━━
${f.actions}

━━━━━━━━━━━━━━━━━━━━
4. 根本原因分析
━━━━━━━━━━━━━━━━━━━━
${f.rootCause}

━━━━━━━━━━━━━━━━━━━━
5. 是正予防措置（CAPA）
━━━━━━━━━━━━━━━━━━━━
担当部門 / 担当者：${f.dept}
CAPA 完了期限：${f.capaDate}
ISO 条項：${f.iso || "—"}

━━━━━━━━━━━━━━━━━━━━
記録者：品質管理部`;
}

function genAuditEN(f: FormData) {
  return `[NCR Non-Conformance Report]

NCR No.: ${f.ncrNo}
Date: ${f.date}

━━━━━━━━━━━━━━━━━━━━
1. BASIC INFORMATION
━━━━━━━━━━━━━━━━━━━━
AWB No.: ${f.awb}
Customer: ${f.customerName}
Date of Occurrence: ${f.date}
Location: ${f.location}
Incident Type: ${f.incidentType}

━━━━━━━━━━━━━━━━━━━━
2. INCIDENT DETAILS
━━━━━━━━━━━━━━━━━━━━
${f.details}

━━━━━━━━━━━━━━━━━━━━
3. IMMEDIATE ACTIONS TAKEN
━━━━━━━━━━━━━━━━━━━━
${f.actions}

━━━━━━━━━━━━━━━━━━━━
4. ROOT CAUSE ANALYSIS
━━━━━━━━━━━━━━━━━━━━
${f.rootCause}

━━━━━━━━━━━━━━━━━━━━
5. CORRECTIVE & PREVENTIVE ACTIONS (CAPA)
━━━━━━━━━━━━━━━━━━━━
Responsible Dept. / Person: ${f.dept}
CAPA Completion Deadline: ${f.capaDate}
ISO Clause: ${f.iso || "—"}

━━━━━━━━━━━━━━━━━━━━
Recorded by: Quality Management Dept.`;
}

// ─── Default form ─────────────────────────────────────────────────────────────
const DEFAULT: FormData = {
  ncrNo: "", customerName: "", awb: "", date: "", location: "",
  incidentType: "货物破损", details: "", actions: "",
  rootCause: "", dept: "", capaDate: "", iso: "",
};

const INCIDENT_TYPES = ["货物破损","运输延误","货物遗失","温控超标","单据错误","数量差异","标签错误","其他"];

// ─── Main component ───────────────────────────────────────────────────────────
export default function NCRGenerator() {
  const [form, setForm] = useState<FormData>(DEFAULT);
  const [reports, setReports] = useState<Reports | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [showDropdown, setShowDropdown] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const set = (k: keyof FormData, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const generate = () => {
    setReports({
      customerZH: genCustomerZH(form), customerJA: genCustomerJA(form), customerEN: genCustomerEN(form),
      auditZH:    genAuditZH(form),    auditJA:    genAuditJA(form),    auditEN:    genAuditEN(form),
    });
    setCopied({});
    setTimeout(() => document.getElementById("reports-section")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
  };

  const copyAll = (lang: "zh" | "ja" | "en") => {
    if (!reports) return;
    const sep = "\n\n" + "─".repeat(50) + "\n\n";
    const map = {
      zh: reports.customerZH + sep + reports.auditZH,
      ja: reports.customerJA + sep + reports.auditJA,
      en: reports.customerEN + sep + reports.auditEN,
    };
    copyText("all_" + lang, map[lang]);
    setShowDropdown(false);
  };

  const isValid = form.customerName && form.awb && form.date && form.location &&
                  form.details && form.actions && form.rootCause && form.dept && form.capaDate;

  return (
    <div style={s.page}>
      {/* ── Header ── */}
      <header style={s.header}>
        <div>
          <div style={s.badge}>OPTEC · 品质管理</div>
          <h1 style={s.title}>NCR 不符合报告自动生成器</h1>
          <p style={s.subtitle}>面向客户版 + 内部审计版 · 中文 / 日语 / English 三语同步输出</p>
        </div>
        <div style={s.langBadges}>
          {["中文", "日語", "English"].map(l => (
            <span key={l} style={s.langBadge}>{l}</span>
          ))}
        </div>
      </header>

      {/* ── Form ── */}
      <section style={s.formSection}>
        <div style={s.sectionTitle}>
          <span style={s.stepNum}>01</span> 填写 NCR 基本信息
        </div>

        <div style={s.formGrid}>
          <Field label="NCR 编号" required={false}>
            <input value={form.ncrNo} onChange={e => set("ncrNo", e.target.value)} placeholder="例：NCR-2024-001" />
          </Field>
          <Field label="客户名称" required>
            <input value={form.customerName} onChange={e => set("customerName", e.target.value)} placeholder="例：ABC Pharma Co., Ltd." />
          </Field>
          <Field label="AWB 提单号" required>
            <input value={form.awb} onChange={e => set("awb", e.target.value)} placeholder="例：176-12345678" />
          </Field>
          <Field label="发生日期" required>
            <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          </Field>
          <Field label="发生地点" required>
            <input value={form.location} onChange={e => set("location", e.target.value)} placeholder="例：上海浦东国际机场" />
          </Field>
          <Field label="异常类型" required>
            <select value={form.incidentType} onChange={e => set("incidentType", e.target.value)}>
              {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="责任部门 / 责任人" required span={1}>
            <input value={form.dept} onChange={e => set("dept", e.target.value)} placeholder="例：操作部 · 张伟" />
          </Field>
          <Field label="CAPA 截止日" required>
            <input type="date" value={form.capaDate} onChange={e => set("capaDate", e.target.value)} />
          </Field>
          <Field label="ISO 条款对应" required={false} hint="选填">
            <input value={form.iso} onChange={e => set("iso", e.target.value)} placeholder="例：ISO 9001:2015 §8.7" />
          </Field>
        </div>

        <div style={s.formGridFull}>
          <Field label="异常详情" required>
            <textarea rows={3} value={form.details}
              onChange={e => set("details", e.target.value)}
              placeholder="详细描述异常情况，包括发现经过、货物状态等..." />
          </Field>
          <Field label="已采取措施" required>
            <textarea rows={3} value={form.actions}
              onChange={e => set("actions", e.target.value)}
              placeholder="已立即采取的处理措施..." />
          </Field>
          <Field label="根本原因分析" required>
            <textarea rows={3} value={form.rootCause}
              onChange={e => set("rootCause", e.target.value)}
              placeholder="分析导致本次异常的根本原因..." />
          </Field>
        </div>

        <div style={s.generateRow}>
          <button style={{ ...s.genBtn, opacity: isValid ? 1 : 0.45, cursor: isValid ? "pointer" : "not-allowed" }}
            onClick={generate} disabled={!isValid}>
            ▶ 生成报告
          </button>
          {!isValid && <span style={s.hint}>请填写所有必填项（带 * 的字段）</span>}
        </div>
      </section>

      {/* ── Reports ── */}
      {reports && (
        <section id="reports-section" style={s.reportsSection}>
          <div style={s.reportHeader}>
            <div style={s.sectionTitle}>
              <span style={s.stepNum}>02</span> 生成报告（2 版本 × 3 语言 = 6 份）
            </div>

            {/* Copy All Dropdown */}
            <div style={{ position: "relative" }} ref={dropRef}>
              <button style={s.copyAllBtn} onClick={() => setShowDropdown(v => !v)}>
                全部复制 ▾
              </button>
              {showDropdown && (
                <div style={s.dropdown}>
                  {[
                    { label: "复制全部中文", lang: "zh" as const },
                    { label: "复制全部日文", lang: "ja" as const },
                    { label: "复制全部英文", lang: "en" as const },
                  ].map(({ label, lang }) => (
                    <button key={lang} style={s.dropItem}
                      onClick={() => copyAll(lang)}>
                      {copied["all_" + lang] ? "已复制 ✓" : label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column labels */}
          <div style={s.colLabels}>
            <div />
            <div style={s.colLabel}>
              <span style={{ ...s.versionTag, background: "rgba(96,165,250,0.15)", color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)" }}>
                面向客户版
              </span>
              <span style={s.colDesc}>礼貌措辞 · 不含内部信息</span>
            </div>
            <div style={s.colLabel}>
              <span style={{ ...s.versionTag, background: "rgba(167,139,250,0.15)", color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)" }}>
                内部审计版
              </span>
              <span style={s.colDesc}>完整字段 · 含根因 / CAPA</span>
            </div>
          </div>

          {/* 3 rows × 2 cols */}
          {([
            { langKey: "ZH", label: "中文", flag: "🇨🇳" },
            { langKey: "JA", label: "日語", flag: "🇯🇵" },
            { langKey: "EN", label: "English", flag: "🇺🇸" },
          ] as const).map(({ langKey, label, flag }) => (
            <div key={langKey} style={s.reportRow}>
              <div style={s.langCell}>
                <span style={s.flagText}>{flag}</span>
                <span style={s.langLabel}>{label}</span>
              </div>
              {(["customer", "audit"] as const).map(ver => {
                const key = `${ver}${langKey}` as keyof Reports;
                const text = reports[key];
                const copyKey = `${ver}_${langKey}`;
                const isCopied = copied[copyKey];
                const verColor = ver === "customer" ? "#60a5fa" : "#a78bfa";
                return (
                  <div key={ver} style={s.reportCard}>
                    <div style={s.cardHeader}>
                      <span style={{ ...s.cardTag, color: verColor }}>
                        {ver === "customer" ? "客户版" : "审计版"} · {label}
                      </span>
                      <button
                        style={{ ...s.copyBtn, ...(isCopied ? s.copyBtnDone : {}) }}
                        onClick={() => copyText(copyKey, text)}>
                        {isCopied ? "已复制 ✓" : "复制"}
                      </button>
                    </div>
                    <textarea style={s.reportText} readOnly value={text} rows={14} />
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      )}

      <footer style={s.footer}>
        OPTEC · NCR 不符合报告自动生成器 · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, span, children }: {
  label: string; required?: boolean; hint?: string; span?: number; children: React.ReactNode;
}) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <label style={s.label}>
        {label}
        {required !== false && <span style={{ color: "#e05555", marginLeft: 3 }}>*</span>}
        {hint && <span style={{ color: "var(--text-dim)", fontSize: 10, marginLeft: 6 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "var(--dark)", paddingBottom: 48 },

  header: {
    background: "linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 100%)",
    borderBottom: "1px solid var(--border)",
    padding: "28px 36px 22px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap",
  },
  badge: {
    display: "inline-block", background: "rgba(201,169,110,0.1)",
    border: "1px solid var(--border)", color: "var(--gold)",
    fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
    padding: "3px 10px", borderRadius: 4, marginBottom: 10, textTransform: "uppercase",
  },
  title: { fontSize: 24, fontWeight: 700, color: "var(--gold-light)", letterSpacing: "0.04em", marginBottom: 6 },
  subtitle: { fontSize: 12, color: "var(--text-dim)", letterSpacing: "0.05em" },
  langBadges: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  langBadge: {
    background: "rgba(201,169,110,0.08)", border: "1px solid var(--border)",
    color: "var(--gold)", fontSize: 11, padding: "4px 12px", borderRadius: 12, letterSpacing: "0.06em",
  },

  formSection: {
    margin: "28px 36px", background: "var(--card)",
    border: "1px solid var(--border)", borderRadius: 12,
    padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  sectionTitle: {
    display: "flex", alignItems: "center", gap: 12,
    fontSize: 14, fontWeight: 700, color: "var(--gold-light)",
    letterSpacing: "0.06em", marginBottom: 20,
  },
  stepNum: {
    background: "var(--gold)", color: "#08080f",
    width: 26, height: 26, borderRadius: "50%",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 900, flexShrink: 0,
  },
  formGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px 20px", marginBottom: 14,
  },
  formGridFull: {
    display: "grid", gridTemplateColumns: "1fr",
    gap: 14, marginBottom: 20,
  },
  label: {
    display: "block", fontSize: 11, color: "var(--text-dim)",
    letterSpacing: "0.06em", marginBottom: 5, fontWeight: 600,
  },
  generateRow: { display: "flex", alignItems: "center", gap: 16 },
  genBtn: {
    background: "linear-gradient(135deg, var(--gold) 0%, #b8892a 100%)",
    color: "#08080f", border: "none", borderRadius: 8,
    padding: "11px 32px", fontSize: 14, fontWeight: 700,
    letterSpacing: "0.06em", transition: "opacity 0.2s",
  },
  hint: { fontSize: 12, color: "var(--text-dim)" },

  reportsSection: {
    margin: "0 36px 24px", background: "var(--card)",
    border: "1px solid var(--border)", borderRadius: 12,
    padding: "24px 28px", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
  },
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  copyAllBtn: {
    background: "rgba(201,169,110,0.1)", border: "1px solid var(--border-strong)",
    color: "var(--gold)", fontSize: 12, fontWeight: 700,
    padding: "7px 18px", borderRadius: 7, cursor: "pointer",
    letterSpacing: "0.06em",
  },
  dropdown: {
    position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
    background: "var(--card2)", border: "1px solid var(--border-strong)",
    borderRadius: 8, overflow: "hidden", minWidth: 160,
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  },
  dropItem: {
    display: "block", width: "100%", textAlign: "left",
    background: "transparent", border: "none", color: "var(--text)",
    fontSize: 12, padding: "10px 16px", cursor: "pointer",
    letterSpacing: "0.04em",
    transition: "background 0.15s",
  },
  colLabels: {
    display: "grid", gridTemplateColumns: "80px 1fr 1fr",
    gap: 12, marginBottom: 8, paddingBottom: 10,
    borderBottom: "1px solid var(--border)",
  },
  colLabel: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  versionTag: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
    padding: "4px 14px", borderRadius: 10, border: "1px solid",
  },
  colDesc: { fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.04em" },

  reportRow: {
    display: "grid", gridTemplateColumns: "80px 1fr 1fr",
    gap: 12, marginBottom: 14,
  },
  langCell: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 4,
    background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
    borderRadius: 8,
  },
  flagText: { fontSize: 20 },
  langLabel: { fontSize: 11, fontWeight: 700, color: "var(--gold)", letterSpacing: "0.06em" },

  reportCard: {
    background: "var(--card2)", border: "1px solid var(--border)",
    borderRadius: 8, overflow: "hidden",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 12px", borderBottom: "1px solid var(--border)",
    background: "rgba(255,255,255,0.02)",
  },
  cardTag: { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" },
  copyBtn: {
    background: "rgba(201,169,110,0.1)", border: "1px solid var(--border)",
    color: "var(--gold)", fontSize: 11, padding: "3px 10px",
    borderRadius: 5, cursor: "pointer", letterSpacing: "0.04em",
    transition: "all 0.2s",
  },
  copyBtnDone: {
    background: "rgba(76,175,80,0.15)", borderColor: "rgba(76,175,80,0.4)",
    color: "#4caf50",
  },
  reportText: {
    width: "100%", resize: "none", background: "transparent",
    border: "none", color: "var(--text)", fontSize: 11,
    lineHeight: 1.6, padding: "10px 12px", fontFamily: "monospace",
    outline: "none",
  },

  footer: {
    textAlign: "center", color: "var(--text-dim)", fontSize: 11,
    letterSpacing: "0.1em", padding: "16px 36px 0",
    borderTop: "1px solid var(--border)", marginTop: 8,
  },
};
