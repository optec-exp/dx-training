"use client";

import { useState } from "react";

export default function InsightsPage() {
  const [month, setMonth] = useState("2026-05");
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string>("");
  const [facts, setFacts] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true); setError(null); setText(""); setFacts("");
    try {
      const res = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setText(data.text); setFacts(data.facts);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>⑨ AI 洞察 · 月度经营点评</h1>
      <p style={{ color: "var(--muted)" }}>汇总当月利润/净利/加成率数据，由 AI 生成中日双语经营点评（数据用代码算，AI 只做解读）。</p>
      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "16px 0" }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px 12px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }} />
        <button className="btn primary" disabled={busy} onClick={run}>{busy ? "AI 生成中…" : "生成经营点评"}</button>
      </div>

      {error && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>{error}</div>}

      {text && (
        <div className="card" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{text}</div>
      )}
      {facts && (
        <details style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
          <summary style={{ cursor: "pointer" }}>点评依据的数据</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{facts}</pre>
        </details>
      )}
    </div>
  );
}
