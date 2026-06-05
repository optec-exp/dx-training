"use client";

import { useCallback, useEffect, useState, Fragment } from "react";
import Collapsible from "./Collapsible";

interface Row { opt_no: string; company: string; 案件收入: number; 入金合计: number; 收入差异: number; 案件成本: number; 支付合计: number; 成本差异: number; 状态: string }
interface Summary { total: number; 收入差异数: number; 成本差异数: number; 案件收入: number; 入金: number; 案件成本: number; 支付: number }
interface Report { month: string; rows: Row[]; summary: Summary }
interface Detail { kind: string; app: string; 金额: number; 取引日: string; 编号: string }

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");
const big = (n: number) => Math.abs(n) > 1;

export default function SyncCheckView({ initialMonth, months }: { initialMonth: string; months: string[] }) {
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fCompany, setFCompany] = useState("全部");
  const [q, setQ] = useState("");
  const [drill, setDrill] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail[]>([]);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { const d = await fetch(`/api/sync-check?month=${month}`).then((x) => x.json()); if (d.error) throw new Error(d.error); setReport(d); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); setReport(null); }
    finally { setLoading(false); }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  async function refresh() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "check", month }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  async function drillOpt(opt: string) {
    if (drill === opt) { setDrill(null); return; }
    setDrill(opt); setDetail([]);
    const d = await fetch(`/api/sync-check?opt=${opt}`).then((x) => x.json()).catch(() => ({ detail: [] }));
    setDetail(d.detail || []);
  }

  const match = (r: Row) => (fCompany === "全部" || r.company === fCompany) && (!q || r.opt_no.toLowerCase().includes(q.toLowerCase()));
  const rows = (report?.rows || []).filter(match);
  const diffRows = rows.filter((r) => r.状态 === "差异");
  const sameRows = rows.filter((r) => r.状态 !== "差异");
  const s = report?.summary;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={sel}>
          {(months.includes(month) ? months : [month, ...months]).map((m) => <option key={m}>{m}</option>)}
        </select>
        <button className="btn primary" disabled={busy} onClick={refresh}>{busy ? "排查中…（读 Kintone）" : "↻ 重新排查"}</button>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>案件App 收入/成本 vs 请求入金/支付App 合计（按 OPT，日元）</span>
      </div>

      {err && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>{err}</div>}
      {loading && <div style={{ color: "var(--muted)" }}>加载中…</div>}

      {!loading && report && report.rows.length === 0 && (
        <div className="warn-box">{month} 暂无排查数据。点上方「↻ 重新排查」从 Kintone 拉取（需先同步案件）。</div>
      )}

      {!loading && s && report!.rows.length > 0 && (
        <>
          <div className="kpi-row">
            <Kpi label="🔴 收入不一致（需排查）" value={s.收入差异数} color={s.收入差异数 ? "var(--red)" : undefined} />
            <Kpi label="🟠 成本不一致（未月结可能正常）" value={s.成本差异数} color={s.成本差异数 ? "var(--amber)" : undefined} />
            <Kpi label="排查票数" value={s.total} />
          </div>

          <Collapsible title="总额概览" defaultOpen={false}>
            <table className="report-table" style={{ maxWidth: 560, boxShadow: "none", margin: 0 }}>
              <thead><tr><th></th><th className="num">案件App</th><th className="num">入金/支付App</th><th className="num">差异</th></tr></thead>
              <tbody>
                <tr><td>收入</td><td className="num">{fmt(s.案件收入)}</td><td className="num">{fmt(s.入金)}</td><td className={"num strong" + (big(s.案件收入 - s.入金) ? " neg" : "")}>{fmt(s.案件收入 - s.入金)}</td></tr>
                <tr><td>成本</td><td className="num">{fmt(s.案件成本)}</td><td className="num">{fmt(s.支付)}</td><td className={"num strong" + (big(s.案件成本 - s.支付) ? " neg" : "")}>{fmt(s.案件成本 - s.支付)}</td></tr>
              </tbody>
            </table>
          </Collapsible>

          <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "14px 0 8px", flexWrap: "wrap" }}>
            <select value={fCompany} onChange={(e) => setFCompany(e.target.value)} style={sel}><option>全部</option><option value="EXPRESS">EXPRESS（空海）</option><option value="TRADING">TRADING（EC）</option></select>
            <input placeholder="搜 OPT 编号" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...sel, width: 160 }} />
            <span style={{ color: "var(--muted)", fontSize: 13 }}>差异 {diffRows.length} 票 · 一致 {sameRows.length} 票</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, margin: "0 0 8px" }}>🔴收入差异=三App同步异常，需排查；🟠成本差异在未月结月份属正常（成本未录全）。点 OPT 看入金/支付明细。</p>

          {diffRows.length === 0 ? <div style={{ color: "var(--green)", margin: "8px 0" }}>✓ 无差异（当前筛选）</div> : (
            <RowsTable rows={diffRows} drill={drill} detail={detail} onDrill={drillOpt} />
          )}

          {sameRows.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <Collapsible title={`✓ 核对一致（${sameRows.length} 票）`} defaultOpen={false} right={<span className="pill pill-green">一致</span>}>
                <RowsTable rows={sameRows} drill={drill} detail={detail} onDrill={drillOpt} />
              </Collapsible>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RowsTable({ rows, drill, detail, onDrill }: { rows: Row[]; drill: string | null; detail: Detail[]; onDrill: (o: string) => void }) {
  return (
    <table className="report-table">
      <thead><tr><th>法人</th><th>OPT 编号</th><th className="num">案件收入</th><th className="num">入金合计</th><th className="num">收入差异</th><th className="num">案件成本</th><th className="num">支付合计</th><th className="num">成本差异</th></tr></thead>
      <tbody>
        {rows.map((r) => {
          const rb = big(r.收入差异), cb = big(r.成本差异);
          return (
            <Fragment key={r.opt_no}>
              <tr className={rb || cb ? "flag" : undefined}>
                <td><span className="pill pill-gray" style={{ fontSize: 11 }}>{r.company === "TRADING" ? "EC" : "空海"}</span></td>
                <td style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => onDrill(r.opt_no)} title="点击看入金/支付明细">{drill === r.opt_no ? "▾ " : "▸ "}{r.opt_no}</td>
                <td className="num">{fmt(r.案件收入)}</td><td className="num">{fmt(r.入金合计)}</td>
                <td className={"num" + (rb ? " neg" : "")} style={rb ? { color: "var(--red)", fontWeight: 600 } : undefined}>{fmt(r.收入差异)}</td>
                <td className="num">{fmt(r.案件成本)}</td><td className="num">{fmt(r.支付合计)}</td>
                <td className={"num" + (cb ? " neg" : "")} style={cb ? { color: "var(--amber)" } : undefined}>{fmt(r.成本差异)}</td>
              </tr>
              {drill === r.opt_no && (
                <tr><td colSpan={8} style={{ background: "var(--panel-2)" }}>
                  {detail.length === 0 ? <span style={{ color: "var(--muted)", fontSize: 12 }}>加载明细中…或该票在入金/支付App无记录</span> : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                      <thead><tr><th style={dth}>类别</th><th style={dth}>来源App</th><th style={dth}>编号</th><th style={dth}>取引/请求日</th><th style={{ ...dth, textAlign: "right" }}>金额(円)</th></tr></thead>
                      <tbody>{detail.map((d, i) => (<tr key={i}><td style={dtd}>{d.kind}</td><td style={dtd}>{d.app}</td><td style={dtd}>{d.编号}</td><td style={dtd}>{d.取引日}</td><td style={{ ...dtd, textAlign: "right" }}>{fmt(d.金额)}</td></tr>))}</tbody>
                    </table>
                  )}
                </td></tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div className="kpi"><div className="kpi-label">{label}</div><div className="kpi-value" style={color ? { color } : undefined}>{value}</div></div>;
}
const sel = { padding: "6px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13 } as const;
const dth = { textAlign: "left" as const, color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "3px 6px" };
const dtd = { padding: "3px 6px", color: "var(--muted)" };
