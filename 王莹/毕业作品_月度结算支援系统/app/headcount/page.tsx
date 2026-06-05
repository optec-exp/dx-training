"use client";

import { useEffect, useState } from "react";

interface Row { 期间: string; cn: number; jp: number }

export default function HeadcountPage() {
  const [月, set月] = useState("2026-05");
  const [cn, setCn] = useState("13");
  const [jp, setJp] = useState("11");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [list, setList] = useState<Row[]>([]);

  async function load() {
    const r = await fetch("/api/headcount/list").then((x) => x.json()).catch(() => ({ rows: [] }));
    setList(r.rows || []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/headcount", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 期间: 月, cn: Number(cn), jp: Number(jp) }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setMsg("✅ 已保存，利润报表 JP DESK 拆分将使用该人数");
      load();
    } catch (e) { setMsg("❌ " + (e instanceof Error ? e.message : String(e))); } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>月度人数录入 · JP DESK 中日拆分</h1>
      <p style={{ color: "var(--muted)" }}>JP DESK（Japan Desk 課）利润按中日人数拆分。未录入则默认 13 : 11。</p>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end", margin: "16px 0", flexWrap: "wrap" }}>
        <Field label="月份"><input type="month" value={月} onChange={(e) => set月(e.target.value)} className="inp" /></Field>
        <Field label="JP DESK 中国人数"><input type="number" value={cn} onChange={(e) => setCn(e.target.value)} className="inp" style={{ width: 120 }} /></Field>
        <Field label="JP DESK 日本人数(TCC+業務)"><input type="number" value={jp} onChange={(e) => setJp(e.target.value)} className="inp" style={{ width: 120 }} /></Field>
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? "保存中…" : "保存"}</button>
      </div>
      {msg && <div className="warn-box" style={{ borderColor: "var(--border)", background: "var(--panel-2)", color: "var(--text)" }}>{msg}</div>}

      <h3>已录入</h3>
      <table className="report-table" style={{ maxWidth: 480 }}>
        <thead><tr><th>月份</th><th className="num">中国人数</th><th className="num">日本人数</th></tr></thead>
        <tbody>
          {list.map((r) => (<tr key={r.期间}><td>{r.期间}</td><td className="num">{r.cn}</td><td className="num">{r.jp}</td></tr>))}
          {list.length === 0 && <tr><td colSpan={3} style={{ color: "var(--muted)" }}>暂无（使用默认 13:11）</td></tr>}
        </tbody>
      </table>
      <style>{`.inp{padding:8px 12px;background:var(--panel);border:1px solid var(--border);border-radius:8px;color:var(--text)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--muted)" }}>{label}{children}</label>;
}
