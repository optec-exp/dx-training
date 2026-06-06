"use client";

import { Fragment, useEffect, useState } from "react";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

interface Neg { opt_no: string; business_scope: string; 毛利: number; 成本: number }
interface Big { opt_no: string; 成本: number; 倍数: number }
interface DrillLine { 供应商: string; 费用科目: string | null; 原币种: string; 金额_原币: number; 金额_日元: number }
interface DrillCase { 顾客: string; business_scope: string; 服务类型: string; 売上_日元: number; 成本_日元: number; 毛利_日元: number }

const th = (txt: string, right: boolean) => ({ textAlign: right ? "right" as const : "left" as const, color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" });
const optBtn: React.CSSProperties = { background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--accent)", cursor: "pointer", fontSize: 11, padding: "1px 7px" };

// 全宽下钻明细行（colSpan 跨满整表，不挤占数据列 → 表头不移位）
function DrillRow({ opt, span }: { opt: string; span: number }) {
  const [data, setData] = useState<{ lines: DrillLine[]; case: DrillCase | null } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    fetch(`/api/risk/drill?opt=${encodeURIComponent(opt)}`).then((x) => x.json()).then((r) => { if (live) { setData(r); setLoading(false); } }).catch(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [opt]);
  return (
    <tr>
      <td colSpan={span} style={{ padding: "0 6px 8px" }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, padding: 10 }}>
          {loading && <div style={{ color: "var(--muted)", fontSize: 12 }}>加载中…</div>}
          {data?.case && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              {data.case.顾客} · {data.case.business_scope} · {data.case.服务类型} ｜ 売上 {yen(data.case.売上_日元)} − 成本 {yen(data.case.成本_日元)} = <b style={{ color: data.case.毛利_日元 < 0 ? "var(--red)" : "var(--green)" }}>{yen(data.case.毛利_日元)}</b>
            </div>
          )}
          {data && data.lines.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
              <thead><tr>{["供应商", "费用科目", "原币", "金额(原币)", "金额(日元)"].map((h, i) => <th key={i} style={th(h, i >= 3)}>{h}</th>)}</tr></thead>
              <tbody>{data.lines.map((l, i) => <tr key={i}><td style={{ padding: "2px 6px" }}>{l.供应商}</td><td style={{ padding: "2px 6px" }}>{l.费用科目 || "—"}</td><td style={{ padding: "2px 6px" }}>{l.原币种}</td><td style={{ padding: "2px 6px", textAlign: "right" }}>{Math.round(l.金额_原币).toLocaleString()}</td><td style={{ padding: "2px 6px", textAlign: "right" }}>{yen(l.金额_日元)}</td></tr>)}</tbody>
            </table>
          )}
          {data && data.lines.length === 0 && !loading && <div style={{ color: "var(--muted)", fontSize: 12 }}>无成本明细</div>}
        </div>
      </td>
    </tr>
  );
}

export function NegTable({ rows }: { rows: Neg[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (rows.length === 0) return <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 无异常</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13, tableLayout: "fixed" }}>
      <thead><tr>{["案件番号", "大类", "毛利", "成本"].map((h, i) => <th key={i} style={th(h, i !== 0)}>{h}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 12).map((r) => (
        <Fragment key={r.opt_no}>
          <tr>
            <td style={{ padding: "3px 6px" }}><button style={optBtn} onClick={() => setOpen(open === r.opt_no ? null : r.opt_no)}>{open === r.opt_no ? "▾" : "▸"} {r.opt_no}</button></td>
            <td style={{ padding: "3px 6px", textAlign: "right" }}>{r.business_scope}</td>
            <td style={{ padding: "3px 6px", textAlign: "right", color: "var(--red)" }}>{yen(r.毛利)}</td>
            <td style={{ padding: "3px 6px", textAlign: "right" }}>{yen(r.成本)}</td>
          </tr>
          {open === r.opt_no && <DrillRow opt={r.opt_no} span={4} />}
        </Fragment>
      ))}</tbody>
    </table>
  );
}

export function BigTable({ rows }: { rows: Big[] }) {
  const [open, setOpen] = useState<string | null>(null);
  if (rows.length === 0) return <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 无异常</div>;
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13, tableLayout: "fixed" }}>
      <thead><tr>{["案件番号", "成本", "倍数"].map((h, i) => <th key={i} style={th(h, i !== 0)}>{h}</th>)}</tr></thead>
      <tbody>{rows.slice(0, 12).map((r) => (
        <Fragment key={r.opt_no}>
          <tr>
            <td style={{ padding: "3px 6px" }}><button style={optBtn} onClick={() => setOpen(open === r.opt_no ? null : r.opt_no)}>{open === r.opt_no ? "▾" : "▸"} {r.opt_no}</button></td>
            <td style={{ padding: "3px 6px", textAlign: "right" }}>{yen(r.成本)}</td>
            <td style={{ padding: "3px 6px", textAlign: "right", color: "var(--amber)" }}>{r.倍数}×</td>
          </tr>
          {open === r.opt_no && <DrillRow opt={r.opt_no} span={3} />}
        </Fragment>
      ))}</tbody>
    </table>
  );
}
