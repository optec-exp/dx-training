"use client";

import { useState } from "react";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

interface Neg { opt_no: string; business_scope: string; 毛利: number; 成本: number }
interface Big { opt_no: string; 成本: number; 倍数: number }
interface DrillLine { 供应商: string; 费用科目: string | null; 原币种: string; 金额_原币: number; 金额_日元: number }
interface DrillCase { 顾客: string; business_scope: string; 服务类型: string; 売上_日元: number; 成本_日元: number; 毛利_日元: number }

function Drill({ opt }: { opt: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ lines: DrillLine[]; case: DrillCase | null } | null>(null);
  const [loading, setLoading] = useState(false);
  async function toggle() {
    const next = !open; setOpen(next);
    if (next && !data) {
      setLoading(true);
      try { const r = await fetch(`/api/risk/drill?opt=${encodeURIComponent(opt)}`).then((x) => x.json()); setData(r); } finally { setLoading(false); }
    }
  }
  return (
    <>
      <button onClick={toggle} title="下钻成本明细" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--accent)", cursor: "pointer", fontSize: 11, padding: "1px 7px" }}>{open ? "▾" : "▸"} {opt}</button>
      {open && (
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: 10, margin: "6px 0" }}>
          {loading && <div style={{ color: "var(--muted)", fontSize: 12 }}>加载中…</div>}
          {data?.case && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              {data.case.顾客} · {data.case.business_scope} · {data.case.服务类型} ｜ 売上 {yen(data.case.売上_日元)} − 成本 {yen(data.case.成本_日元)} = <b style={{ color: data.case.毛利_日元 < 0 ? "var(--red)" : "var(--green)" }}>{yen(data.case.毛利_日元)}</b>
            </div>
          )}
          {data && data.lines.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
              <thead><tr>{["供应商", "费用科目", "原币", "金额(原币)", "金额(日元)"].map((h, i) => <th key={i} style={{ textAlign: i < 3 ? "left" : "right", color: "var(--muted)", fontWeight: 600, fontSize: 10, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
              <tbody>{data.lines.map((l, i) => <tr key={i}><td style={{ padding: "2px 6px" }}>{l.供应商}</td><td style={{ padding: "2px 6px" }}>{l.费用科目 || "—"}</td><td style={{ padding: "2px 6px" }}>{l.原币种}</td><td style={{ padding: "2px 6px", textAlign: "right" }}>{Math.round(l.金额_原币).toLocaleString()}</td><td style={{ padding: "2px 6px", textAlign: "right" }}>{yen(l.金额_日元)}</td></tr>)}</tbody>
            </table>
          )}
          {data && data.lines.length === 0 && !loading && <div style={{ color: "var(--muted)", fontSize: 12 }}>无成本明细</div>}
        </div>
      )}
    </>
  );
}

export function NegTable({ rows }: { rows: Neg[] }) {
  if (rows.length === 0) return <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 无异常</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
      <thead><tr>{["OPT", "大类", "毛利", "成本"].map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "right", color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 12).map((r) => (
        <tr key={r.opt_no}><td style={{ padding: "3px 6px" }}><Drill opt={r.opt_no} /></td><td style={{ padding: "3px 6px", textAlign: "right" }}>{r.business_scope}</td><td style={{ padding: "3px 6px", textAlign: "right", color: "var(--red)" }}>{yen(r.毛利)}</td><td style={{ padding: "3px 6px", textAlign: "right" }}>{yen(r.成本)}</td></tr>
      ))}</tbody>
    </table>
  );
}

export function BigTable({ rows }: { rows: Big[] }) {
  if (rows.length === 0) return <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 无异常</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
      <thead><tr>{["OPT", "成本", "倍数"].map((h, i) => <th key={i} style={{ textAlign: i === 0 ? "left" : "right", color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 12).map((r) => (
        <tr key={r.opt_no}><td style={{ padding: "3px 6px" }}><Drill opt={r.opt_no} /></td><td style={{ padding: "3px 6px", textAlign: "right" }}>{yen(r.成本)}</td><td style={{ padding: "3px 6px", textAlign: "right", color: "var(--amber)" }}>{r.倍数}×</td></tr>
      ))}</tbody>
    </table>
  );
}
