"use client";

import { useEffect, useState } from "react";

interface BiItem { zh: string; ja: string }
interface Report {
  summary_zh: string; summary_ja: string;
  overview_zh: string; overview_ja: string;
  highlights: BiItem[]; risks: BiItem[]; suggestions: BiItem[];
}

export default function InsightsPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [month, setMonth] = useState("2026-05");
  const [范围, set范围] = useState<"全社" | "中国" | "日本">("全社");
  const [期间, set期间] = useState<"单月" | "财年累计">("单月");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [facts, setFacts] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/insights").then((r) => r.json()).then((d) => {
      const ms: string[] = d.months || [];
      setMonths(ms); if (ms.length && !ms.includes(month)) setMonth(ms[0]);
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function run() {
    setBusy(true); setError(null); setReport(null); setFacts(""); setCopied(false);
    try {
      const res = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, 范围, 期间 }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setReport(data.report); setFacts(data.facts);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  function plainText() {
    if (!report) return "";
    const sec = (t: string, items: BiItem[]) => items.length ? `\n【${t}】\n` + items.map((i) => `· ${i.zh}\n  ${i.ja}`).join("\n") : "";
    return `${范围} ${期间 === "财年累计" ? `财年累计（截至 ${month}）` : month} ${期间 === "财年累计" ? "财年累计" : "月度"}经营汇报\n\n摘要：${report.summary_zh} / ${report.summary_ja}\n\n${report.overview_zh}\n${report.overview_ja}\n${sec("亮点", report.highlights)}${sec("风险", report.risks)}${sec("建议", report.suggestions)}`.trim();
  }
  async function copy() { try { await navigator.clipboard.writeText(plainText()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑨ AI 洞察 · 月度经营汇报</h1>
      <p style={{ color: "var(--muted)" }}>汇总当月利润 + 环比 + 预实达成 + 风控/资金，由 AI 生成结构化中日双语经营点评（数据用代码算，AI 只解读）。</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0", flexWrap: "wrap" }}>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={sel}>
          {months.length === 0 && <option value={month}>{month}</option>}
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={范围} onChange={(e) => set范围(e.target.value as "全社" | "中国" | "日本")} style={sel}>
          <option>全社</option><option>中国</option><option>日本</option>
        </select>
        <select value={期间} onChange={(e) => set期间(e.target.value as "单月" | "财年累计")} style={sel}>
          <option>单月</option><option>财年累计</option>
        </select>
        <button className="btn primary" disabled={busy} onClick={run}>{busy ? "AI 生成中…" : "生成经营汇报"}</button>
        {report && <button className="btn" onClick={copy}>{copied ? "✓ 已复制" : "复制全文"}</button>}
      </div>

      {error && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>{error}</div>}

      {report && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ borderLeft: "4px solid var(--accent)", padding: 16 }}>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>摘要 · {范围} · {期间 === "财年累计" ? `财年累计（截至 ${month}）` : month}</div>
            <div style={{ fontWeight: 650, fontSize: 16 }}>{report.summary_zh}</div>
            <div style={{ color: "var(--muted)", marginTop: 2 }}>{report.summary_ja}</div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 650, marginBottom: 6 }}>经营概述</div>
            <div style={{ lineHeight: 1.7 }}>{report.overview_zh}</div>
            <div style={{ lineHeight: 1.7, color: "var(--muted)", marginTop: 6 }}>{report.overview_ja}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
            <BiList title="✨ 亮点" items={report.highlights} color="var(--green)" />
            <BiList title="⚠️ 风险" items={report.risks} color="var(--red)" />
            <BiList title="💡 管理建议" items={report.suggestions} color="var(--accent)" />
          </div>
        </div>
      )}

      {facts && (
        <details style={{ marginTop: 16, color: "var(--muted)", fontSize: 13 }}>
          <summary style={{ cursor: "pointer" }}>点评依据的数据</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{facts}</pre>
        </details>
      )}
    </div>
  );
}

const sel: React.CSSProperties = { padding: "8px 12px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" };

function BiList({ title, items, color }: { title: string; items: BiItem[]; color: string }) {
  return (
    <div className="card" style={{ padding: 14, borderTop: `3px solid ${color}` }}>
      <div style={{ fontWeight: 650, marginBottom: 8 }}>{title}</div>
      {items.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>—</div> : (
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((it, i) => (
            <li key={i} style={{ lineHeight: 1.5 }}>
              <div>{it.zh}</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>{it.ja}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
