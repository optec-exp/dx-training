"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import Collapsible from "./Collapsible";

interface Row { id: string; opt_no: string; 供应商: string; 账单金额_原币: number; kintone金额_原币: number | null; 差额: number | null; 差异类型: string; 状态: string; 利润月: string; 复核备注?: string }
const yen = (n: number | null) => (n == null ? "—" : Math.round(n).toLocaleString("ja-JP"));
const STATE: Record<string, string> = { 待复核: "pill-amber", 确认无误: "pill-green", 待代理改单: "pill-red", 已解决: "pill-green" };

export default function ReconWorkbench({ refresh = 0 }: { refresh?: number }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [fMonth, setFMonth] = useState("");
  const [fState, setFState] = useState("待处理");
  const [drill, setDrill] = useState<string | null>(null);
  const [lines, setLines] = useState<{ 供应商: string; 费用科目: string; 原币种: string; 金额_原币: number }[]>([]);

  async function drillOpt(opt: string) {
    if (drill === opt) { setDrill(null); return; }
    const d = await fetch(`/api/bills?opt=${opt}`).then((x) => x.json()).catch(() => ({ lines: [] }));
    setLines(d.lines || []); setDrill(opt);
  }

  const load = useCallback(async () => {
    const r = await fetch("/api/reconcile/review").then((x) => x.json()).catch(() => ({ rows: [] }));
    setRows(r.rows || []); setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load, refresh]);

  async function mark(id: string, 状态: string) {
    const 备注 = 状态 === "待复核" ? "" : (window.prompt("复核备注（可选）") || "");
    await fetch("/api/reconcile/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, 状态, 备注 }) });
    load();
  }

  const months = [...new Set(rows.map((r) => r.利润月))].sort().reverse();
  const filtered = rows.filter((r) => (!fMonth || r.利润月 === fMonth) && (fState === "全部" || (fState === "待处理" ? r.状态 === "待复核" : r.状态 !== "待复核")));
  const 待处理数 = rows.filter((r) => r.状态 === "待复核").length;

  if (!loaded) return null;
  return (
    <Collapsible title="差异工作台（人工复核）" defaultOpen={true} right={<span className={`pill ${待处理数 ? "pill-amber" : "pill-green"}`}>待处理 {待处理数}</span>}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <select value={fMonth} onChange={(e) => setFMonth(e.target.value)} style={sel}><option value="">全部月份</option>{months.map((m) => <option key={m}>{m}</option>)}</select>
        <select value={fState} onChange={(e) => setFState(e.target.value)} style={sel}><option>待处理</option><option>已处理</option><option>全部</option></select>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>{filtered.length} 条</span>
      </div>
      {filtered.length === 0 ? <div style={{ color: "var(--green)" }}>✓ 无符合条件的差异</div> : (
        <table className="report-table" style={{ boxShadow: "none", margin: 0 }}>
          <thead><tr><th>利润月</th><th>OPT</th><th>供应商</th><th className="num">账单</th><th className="num">Kintone</th><th className="num">差额</th><th>类型</th><th>状态</th><th>备注</th><th>操作</th></tr></thead>
          <tbody>
            {filtered.map((r) => (
              <Fragment key={r.id}>
              <tr className={r.状态 === "待复核" ? "flag" : undefined}>
                <td>{r.利润月}</td>
                <td style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => drillOpt(r.opt_no)} title="点击看该票 Kintone 成本明细">{drill === r.opt_no ? "▾ " : "▸ "}{r.opt_no}</td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.供应商}</td>
                <td className="num">{yen(r.账单金额_原币)}</td><td className="num">{yen(r.kintone金额_原币)}</td>
                <td className={"num" + (r.差额 ? " neg" : "")}>{yen(r.差额)}</td>
                <td>{r.差异类型}</td>
                <td><span className={`pill ${STATE[r.状态] || "pill-gray"}`}>{r.状态}</span></td>
                <td style={{ fontSize: 12, color: "var(--muted)" }}>{r.复核备注 || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {r.状态 === "待复核" ? (
                    <>
                      <button className="btn" style={btn} onClick={() => mark(r.id, "确认无误")}>无误</button>
                      <button className="btn" style={btn} onClick={() => mark(r.id, "待代理改单")}>代理改单</button>
                    </>
                  ) : <button className="btn" style={btn} onClick={() => mark(r.id, "待复核")}>↺ 撤销</button>}
                </td>
              </tr>
              {drill === r.opt_no && (
                <tr><td colSpan={10} style={{ background: "var(--panel-2)" }}>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>OPT {r.opt_no} · Kintone 成本明细（{lines.length} 笔）</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                    <tbody>{lines.map((l, i) => (<tr key={i}><td style={{ padding: "2px 6px" }}>{l.供应商}</td><td style={{ padding: "2px 6px" }}>{l.费用科目}</td><td style={{ padding: "2px 6px", textAlign: "right" }}>{l.原币种} {Math.round(l.金额_原币).toLocaleString()}</td></tr>))}</tbody>
                  </table>
                </td></tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </Collapsible>
  );
}
const sel = { padding: "6px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13 } as const;
const btn = { padding: "3px 9px", fontSize: 12, marginRight: 4 } as const;
