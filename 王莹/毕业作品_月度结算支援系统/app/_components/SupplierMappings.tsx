"use client";

import { useEffect, useState } from "react";
import Collapsible from "./Collapsible";

interface M { 账单供应商: string; kintone供应商: string }

export default function SupplierMappings() {
  const [rows, setRows] = useState<M[]>([]);
  const [a, setA] = useState(""); const [b, setB] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function load() { fetch("/api/supplier-mappings").then((x) => x.json()).then((d) => { setRows(d.rows || []); setLoaded(true); }).catch(() => setLoaded(true)); }
  useEffect(() => { load(); }, []);

  async function add() {
    if (!a || !b) return;
    setBusy(true);
    try { await fetch("/api/supplier-mappings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 账单供应商: a, kintone供应商: b }) }); setA(""); setB(""); load(); }
    finally { setBusy(false); }
  }

  if (!loaded) return null;
  return (
    <Collapsible title="供应商映射记忆" right={<span style={{ color: "var(--muted)", fontSize: 13 }}>{rows.length} 条</span>}>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 0 }}>当账单上的供应商名与 Kintone 录入名完全不同（无字母重叠）对不上时，在此登记一次，以后对账自动匹配。</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input placeholder="账单上的供应商名" value={a} onChange={(e) => setA(e.target.value)} style={inp} />
        <span style={{ color: "var(--muted)" }}>→</span>
        <input placeholder="Kintone 里的供应商名" value={b} onChange={(e) => setB(e.target.value)} style={inp} />
        <button className="btn primary" disabled={busy} onClick={add}>{busy ? "…" : "登记"}</button>
      </div>
      {rows.length > 0 && (
        <table className="report-table" style={{ boxShadow: "none", margin: 0, maxWidth: 720 }}>
          <thead><tr><th>账单供应商</th><th>Kintone 供应商</th></tr></thead>
          <tbody>{rows.map((m, i) => (<tr key={i}><td>{m.账单供应商}</td><td>{m.kintone供应商}</td></tr>))}</tbody>
        </table>
      )}
    </Collapsible>
  );
}
const inp = { padding: "7px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", width: 220 } as const;
