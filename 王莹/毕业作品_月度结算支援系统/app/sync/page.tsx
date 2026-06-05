"use client";

import { useState } from "react";

export default function SyncPage() {
  const [month, setMonth] = useState("2026-05");
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(type: "cases" | "sga" | "all") {
    setBusy(type);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, month }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>↻ Kintone 同步</h1>
      <p style={{ color: "var(--muted)" }}>
        从 Kintone（只读）拉取指定月份数据，写入 settlement 镜像表。Kintone 数据绝不被修改。
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "20px 0" }}>
        <label>利润月：</label>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ padding: "8px 12px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }}
        />
        <button className="btn" disabled={!!busy} onClick={() => run("cases")}>
          {busy === "cases" ? "同步中…" : "同步案件"}
        </button>
        <button className="btn" disabled={!!busy} onClick={() => run("sga")}>
          {busy === "sga" ? "同步中…" : "同步贩管费"}
        </button>
        <button className="btn primary" disabled={!!busy} onClick={() => run("all")}>
          {busy === "all" ? "同步中…" : "全部同步"}
        </button>
      </div>

      {error && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>同步失败：{error}</div>}

      {result != null && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ color: "var(--green)", marginBottom: 8 }}>✅ 同步完成</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13, color: "var(--text)" }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 20 }}>
        同步后到 <a href="/profit" style={{ color: "var(--accent)" }}>利润报表</a> 查看结果。
      </p>
    </div>
  );
}
