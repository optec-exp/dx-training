"use client";

import { useEffect, useState } from "react";

interface Row { 期间: string; 报表对象: string; 毛利: number | null; 贩管费: number | null; 净利: number | null }
const yen = (n: number | null) => (n == null ? "—" : "¥" + Math.round(n).toLocaleString("ja-JP"));

export default function BudgetPage() {
  const [月, set月] = useState("2026-05");
  const [对象, set对象] = useState("全社");
  const [毛利, set毛利] = useState("");
  const [贩管费, set贩管费] = useState("");
  const [净利, set净利] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<Row[]>([]);

  async function load() { const r = await fetch("/api/budget").then((x) => x.json()).catch(() => ({ rows: [] })); setList(r.rows || []); }
  useEffect(() => { load(); }, []);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/budget", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 期间: 月, 报表对象: 对象, 毛利: Number(毛利), 贩管费: Number(贩管费), 净利: Number(净利) }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMsg("✅ 已保存，利润报表将显示预实对比"); load();
    } catch (e) { setMsg("❌ " + (e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>¥ 预算录入</h1>
      <p style={{ color: "var(--muted)" }}>录入 全社/中国/日本 的 毛利/贩管费/净利 预算，利润报表自动做预实对比。</p>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", margin: "16px 0", flexWrap: "wrap" }}>
        <Field label="月份"><input type="month" value={月} onChange={(e) => set月(e.target.value)} className="inp" /></Field>
        <Field label="报表对象"><select value={对象} onChange={(e) => set对象(e.target.value)} className="inp"><option>全社</option><option>中国</option><option>日本</option></select></Field>
        <Field label="毛利预算"><input type="number" value={毛利} onChange={(e) => set毛利(e.target.value)} className="inp" style={{ width: 140 }} /></Field>
        <Field label="贩管费预算"><input type="number" value={贩管费} onChange={(e) => set贩管费(e.target.value)} className="inp" style={{ width: 140 }} /></Field>
        <Field label="净利预算"><input type="number" value={净利} onChange={(e) => set净利(e.target.value)} className="inp" style={{ width: 140 }} /></Field>
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? "保存中…" : "保存"}</button>
      </div>
      {msg && <div className="warn-box" style={{ borderColor: "var(--border)", background: "var(--panel-2)", color: "var(--text)" }}>{msg}</div>}

      <h3>已录入预算</h3>
      <table className="report-table">
        <thead><tr><th>月份</th><th>对象</th><th className="num">毛利</th><th className="num">贩管费</th><th className="num">净利</th></tr></thead>
        <tbody>
          {list.map((r, i) => (<tr key={i}><td>{r.期间}</td><td>{r.报表对象}</td><td className="num">{yen(r.毛利)}</td><td className="num">{yen(r.贩管费)}</td><td className="num">{yen(r.净利)}</td></tr>))}
          {list.length === 0 && <tr><td colSpan={5} style={{ color: "var(--muted)" }}>暂无</td></tr>}
        </tbody>
      </table>
      <style>{`.inp{padding:8px 12px;background:var(--panel);border:1px solid var(--border);border-radius:8px;color:var(--text)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--muted)" }}>{label}{children}</label>;
}
