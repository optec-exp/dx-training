"use client";

import { useCallback, useEffect, useState, Fragment } from "react";
import Collapsible from "./Collapsible";
import { LineCard } from "./Charts";

interface BankRow { 银行: string; 币种: string; 期初残高: number | null; 期末残高: number | null; 残高差额: number | null; 円換算残高: number | null; 対象法人: string | null }
interface Constituent { 入金EXP: number; 入金TRD: number; 业务出金EXP: number; 业务出金TRD: number; 贩管费出金: number }
interface CashRow { 币种: string; 残高差额: number; 入金合计: number; 出金合计: number; 现金净额: number; 差异: number; 状态: string; 构成?: Constituent | null }
interface Report { rows: BankRow[]; byCurrency: { 币种: string; 差额: number; count: number }[]; byLegal: { 法人: string; 残高差额: number; 円換算残高: number; count: number }[]; 円換算残高合计: number }
interface Data { settlement: Report; cash: CashRow[]; trend: { 月份: string; 残高差额: number; 现金净额: number }[] }

const fmt = (n: number | null) => (n == null ? "—" : Math.round(n).toLocaleString("ja-JP"));

export default function SettlementView({ initialMonth, months }: { initialMonth: string; months: string[] }) {
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drill, setDrill] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { const d = await fetch(`/api/settlement?month=${month}`).then((x) => x.json()); if (d.error) throw new Error(d.error); setData(d); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); setData(null); }
    finally { setLoading(false); }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  async function refresh() {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "settlement", month }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  }

  const rep = data?.settlement, cash = data?.cash || [], trend = data?.trend || [];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={sel}>
          {(months.includes(month) ? months : [month, ...months]).map((m) => <option key={m}>{m}</option>)}
        </select>
        <button className="btn primary" disabled={busy} onClick={refresh}>{busy ? "同步中…（读 Kintone）" : "↻ 重新同步"}</button>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>残高差额 = 本月末 − 上月末；现金净额 = 入金 − 出金（现金制，按币种）</span>
      </div>

      {err && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>{err}</div>}
      {loading && <div style={{ color: "var(--muted)" }}>加载中…</div>}

      {!loading && rep && rep.rows.length === 0 && (
        <div className="warn-box">{month} 暂无银行残高数据。点上方「↻ 重新同步」从 Kintone 拉取。</div>
      )}

      {!loading && rep && rep.rows.length > 0 && (
        <>
          {/* 円換算残高 + 法人 */}
          <h3 style={{ marginTop: 0 }}>円換算残高（折日元）· 按法人</h3>
          <div className="kpi-row">
            <div className="kpi primary"><div className="kpi-label">円換算残高 合计</div><div className="kpi-value">¥{fmt(rep.円換算残高合计)}</div></div>
            {rep.byLegal.map((l) => (
              <div className="kpi" key={l.法人}><div className="kpi-label">{l.法人}（{l.count} 账户）</div><div className="kpi-value" style={{ fontSize: 20 }}>¥{fmt(l.円換算残高)}</div></div>
            ))}
          </div>

          <h3>残高差额 · 按币种</h3>
          <div className="kpi-row">
            {rep.byCurrency.map((c) => (
              <div className="kpi" key={c.币种}>
                <div className="kpi-label">{c.币种}（{c.count} 账户）</div>
                <div className="kpi-value" style={{ color: c.差额 >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(c.差额)}</div>
              </div>
            ))}
          </div>

          {trend.length >= 2 && (
            <div style={{ maxWidth: 640, marginTop: 16 }}>
              <LineCard title="残高差额 / 现金净额 月度趋势" data={trend as unknown as Record<string, unknown>[]} xKey="月份"
                lines={[{ key: "残高差额", name: "残高差额", color: "#2563eb" }, { key: "现金净额", name: "现金净额", color: "#34d399" }]} />
            </div>
          )}

          <Collapsible title="银行 × 币种 明细" defaultOpen={false} right={<span style={{ color: "var(--muted)", fontSize: 13 }}>{rep.rows.length} 账户</span>}>
            <table className="report-table" style={{ boxShadow: "none", margin: 0 }}>
              <thead><tr><th>法人</th><th>银行</th><th>币种</th><th className="num">上月末</th><th className="num">本月末</th><th className="num">残高差额</th><th className="num">円換算残高</th></tr></thead>
              <tbody>
                {rep.rows.map((r, i) => (
                  <tr key={i}>
                    <td><span className="pill pill-gray" style={{ fontSize: 11 }}>{r.対象法人 || "—"}</span></td>
                    <td>{r.银行}</td><td>{r.币种}</td>
                    <td className="num">{fmt(r.期初残高)}</td><td className="num">{fmt(r.期末残高)}</td>
                    <td className="num strong" style={{ color: (Number(r.残高差额) || 0) >= 0 ? "var(--green)" : "var(--red)" }}>{fmt(r.残高差额)}</td>
                    <td className="num">¥{fmt(r.円換算残高)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Collapsible>

          {cash.length > 0 && (
            <>
              <h3 style={{ marginTop: 20 }}>现金勾稽 · 残高差额 vs 现金净额（按币种，点币种看构成）</h3>
              <table className="report-table">
                <thead><tr><th>币种</th><th className="num">残高差额</th><th className="num">入金</th><th className="num">出金</th><th className="num">现金净额</th><th className="num">差异</th><th>状态</th></tr></thead>
                <tbody>
                  {cash.map((c) => (
                    <Fragment key={c.币种}>
                      <tr className={c.状态 !== "平" ? "flag" : undefined}>
                        <td style={{ cursor: "pointer", color: "var(--accent)" }} onClick={() => setDrill(drill === c.币种 ? null : c.币种)}>{drill === c.币种 ? "▾ " : "▸ "}{c.币种}</td>
                        <td className="num">{fmt(c.残高差额)}</td><td className="num">{fmt(c.入金合计)}</td><td className="num">{fmt(c.出金合计)}</td>
                        <td className="num">{fmt(c.现金净额)}</td>
                        <td className={"num strong" + (c.差异 !== 0 ? " neg" : "")}>{fmt(c.差异)}</td>
                        <td><span className={`pill ${c.状态 === "平" ? "pill-green" : "pill-amber"}`}>{c.状态}</span></td>
                      </tr>
                      {drill === c.币种 && c.构成 && (
                        <tr><td colSpan={7} style={{ background: "var(--panel-2)" }}>
                          <table style={{ width: "100%", maxWidth: 520, borderCollapse: "collapse", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                            <tbody>
                              <tr><td style={dtd}>入金 · EXP</td><td style={dtdR}>{fmt(c.构成.入金EXP)}</td><td style={dtd}>入金 · TRD</td><td style={dtdR}>{fmt(c.构成.入金TRD)}</td></tr>
                              <tr><td style={dtd}>业务出金 · EXP</td><td style={dtdR}>{fmt(c.构成.业务出金EXP)}</td><td style={dtd}>业务出金 · TRD</td><td style={dtdR}>{fmt(c.构成.业务出金TRD)}</td></tr>
                              <tr><td style={dtd}>贩管费出金（共通）</td><td style={dtdR}>{fmt(c.构成.贩管费出金)}</td><td style={dtd}>现金净额</td><td style={{ ...dtdR, fontWeight: 700 }}>{fmt(c.现金净额)}</td></tr>
                            </tbody>
                          </table>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>现金净额 = (入金EXP+入金TRD) − (业务出金EXP+业务出金TRD) − 贩管费出金</div>
                        </td></tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
              <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>口径=实际收付款日（现金制）。<b>差异仅提示、不阻断关账</b>——银行账户未必涵盖全部业务现金（如非业务往来、跨币种调拨、汇率折算），差异需人工排查。</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
const sel = { padding: "6px 10px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", fontSize: 13 } as const;
const dtd = { padding: "3px 8px", color: "var(--muted)" };
const dtdR = { padding: "3px 8px", textAlign: "right" as const, fontVariantNumeric: "tabular-nums" as const };
