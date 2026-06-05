"use client";

import { useEffect, useState, useCallback } from "react";
import Collapsible from "./Collapsible";

interface Item { opt_no: string; 费用科目: string; 币种: string; 金额: number }
interface Group { 供应商: string; 笔数: number; 金额: number; 币种: string; items: Item[] }
interface Report { 齐全率: number; 成本行数: number; 缺账单行数: number; 缺账单金额: number; groups: Group[] }
const yen = (n: number) => Math.round(n).toLocaleString("ja-JP");

export default function MissingBills() {
  const [month, setMonth] = useState("2026-05");
  const [r, setR] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [exp, setExp] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try { const d = await fetch(`/api/missing-bills?month=${month}`).then((x) => x.json()); setR(d.error ? null : d); }
    finally { setBusy(false); }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  const qlRate = r ? Math.round(r.齐全率 * 100) : 0;

  return (
    <Collapsible
      title={`缺账单清单（Kintone 有成本、尚无账单）`}
      right={r && <span className={`pill ${ql( qlRate)}`}>齐全率 {qlRate}% · 缺 {r.缺账单行数} 笔</span>}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "6px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
        {busy && <span style={{ color: "var(--muted)", fontSize: 13 }}>加载中…</span>}
        {r && <span style={{ color: "var(--muted)", fontSize: 13 }}>成本 {r.成本行数} 行，缺账单 {r.缺账单行数} 行 ¥{yen(r.缺账单金额)}（齐全率 100% 方可月结）</span>}
      </div>
      {r && r.groups.length === 0 && <div style={{ color: "var(--green)" }}>✓ 该月成本全部已收到账单</div>}
      {r && r.groups.map((g) => (
        <div key={g.供应商} style={{ borderBottom: "1px solid var(--border)" }}>
          <div onClick={() => setExp(exp === g.供应商 ? null : g.供应商)} style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", cursor: "pointer" }}>
            <div><span style={{ color: "var(--accent)", marginRight: 6 }}>{exp === g.供应商 ? "▾" : "▸"}</span>{g.供应商 || "(无供应商)"}</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>{g.笔数} 笔 · <b style={{ color: "var(--red)" }}>{g.币种} {yen(g.金额)}</b></div>
          </div>
          {exp === g.供应商 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, margin: "4px 0 10px", fontVariantNumeric: "tabular-nums" }}>
              <thead><tr><th style={th}>OPT</th><th style={th}>费用科目</th><th style={{ ...th, textAlign: "right" }}>金额</th></tr></thead>
              <tbody>{g.items.map((it, i) => (<tr key={i}><td style={td}>{it.opt_no}</td><td style={td}>{it.费用科目}</td><td style={{ ...td, textAlign: "right" }}>{it.币种} {yen(it.金额)}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      ))}
    </Collapsible>
  );
}
const th = { textAlign: "left" as const, color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "3px 6px" };
const td = { padding: "3px 6px", color: "var(--muted)" };
function ql(rate: number) { return rate >= 100 ? "pill-green" : rate >= 60 ? "pill-amber" : "pill-red"; }
