"use client";

import { useEffect, useState, useCallback } from "react";

interface Agg { 毛利: number; 贩管费: number; 净利: number }
interface Snapshot { 冻结时间: string; 案件数: number; 全社: Agg; 中国: Agg; 日本: Agg }
interface Change { 已关账: boolean; 冻结时间: string | null; changed: boolean; diffs: { 维度: string; 指标: string; 快照值: number; 当前值: number; 差额: number }[] }
interface Status {
  month: string;
  对账: { total: number; matched: number; 差异: number; 缺账单: number };
  同步差异: number;
  齐全: boolean;
  锁定状态: string;
  正式锁账日: string;
  审计?: { 时间: string; 用户: string; 动作: string; 对象类型: string; 对象id: string }[];
  快照?: { 聚合快照: Snapshot; 冻结时间: string } | null;
  变更?: Change;
}
const STATE_LABEL: Record<string, string> = { 进行中: "进行中", 月结: "月结（软关账）", 正式锁账: "已关账·快照已冻结" };
const STATE_PILL: Record<string, string> = { 进行中: "pill-gray", 月结: "pill-amber", 正式锁账: "pill-green" };
const yen = (n: number) => Math.round(n).toLocaleString("ja-JP");

export default function ClosePage() {
  const [month, setMonth] = useState("2026-05");
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const r = await fetch(`/api/close?month=${month}`).then((x) => x.json());
      if (r.error) throw new Error(r.error);
      setS(r);
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  }, [month]);
  useEffect(() => { load(); }, [load]);

  async function setState(锁定状态: string) {
    setBusy(true); setErr(null);
    try {
      const r = await fetch("/api/close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month, 锁定状态 }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      await load();
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  const 齐全 = s?.齐全 ?? false;
  const 已关账 = s?.锁定状态 === "正式锁账";
  const snap = 已关账 ? s?.快照?.聚合快照 : undefined; // 仅已关账显示快照基线

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>关账 / 锁账</h1>
      <p style={{ color: "var(--muted)", fontSize: 13, marginTop: -4 }}>本系统负责：缺账单门禁 + 冻结当期快照（基线）+ 锁后变更侦测。记录级解锁/审批在 Kintone 侧执行，本系统只读、只侦测。</p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
        {s && <span className={`pill ${STATE_PILL[s.锁定状态]}`}>{STATE_LABEL[s.锁定状态] || s.锁定状态}</span>}
      </div>
      {err && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>{err}</div>}
      {s && (
        <>
          <div className="kpi-row">
            <Kpi label="对账匹配" value={s.对账.matched} />
            <Kpi label="金额差异" value={s.对账.差异} color={s.对账.差异 ? "var(--amber)" : undefined} />
            <Kpi label="缺账单/漏录" value={s.对账.缺账单} color={s.对账.缺账单 ? "var(--red)" : undefined} />
            <Kpi label="同步差异票" value={s.同步差异} color={s.同步差异 ? "var(--red)" : undefined} />
          </div>

          {/* 锁后变更侦测 */}
          {s.变更?.已关账 && (
            s.变更.changed ? (
              <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)", marginTop: 16 }}>
                <b>⚠ 锁后数据已变更</b>（快照冻结于 {s.变更.冻结时间?.replace("T", " ").slice(0, 16)}）—— Kintone 在关账后被改动，请核对：
                <table className="report-table" style={{ marginTop: 8, maxWidth: 640 }}>
                  <thead><tr><th>维度</th><th>指标</th><th className="num">快照基线</th><th className="num">当前</th><th className="num">变动</th></tr></thead>
                  <tbody>{s.变更.diffs.map((d, i) => (
                    <tr key={i}><td>{d.维度}</td><td>{d.指标}</td><td className="num">{yen(d.快照值)}</td><td className="num">{yen(d.当前值)}</td><td className="num strong neg">{d.差额 > 0 ? "+" : ""}{yen(d.差额)}</td></tr>
                  ))}</tbody>
                </table>
                <div style={{ fontSize: 12, marginTop: 6 }}>如该变更已在 Kintone 审批通过，可点下方「重新冻结快照」把当前值设为新基线。</div>
              </div>
            ) : (
              <div className="warn-box" style={{ borderColor: "var(--green)", color: "var(--green)", marginTop: 16 }}>✓ 锁后无变更（与快照基线一致，冻结于 {s.变更.冻结时间?.replace("T", " ").slice(0, 16)}）</div>
            )
          )}

          <div className="card" style={{ marginTop: 16, maxWidth: 720 }}>
            <div style={{ marginBottom: 10 }}>
              关账门禁：{齐全 ? <span className="pill pill-green">✓ 齐全，可月结/关账</span> : <span className="pill pill-red">● 有未决：缺账单 {s.对账.缺账单} · 金额差异 {s.对账.差异}</span>}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
              正式锁账日（M+2 月 1 日，宽限 1 个月）：<b>{s.正式锁账日}</b>
              {snap && <span className="pill pill-green" style={{ marginLeft: 12 }}>❄ 快照已冻结 {snap.冻结时间?.replace("T", " ").slice(0, 16)}</span>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn" disabled={busy || s.锁定状态 !== "进行中" || !齐全} title={!齐全 ? "门禁未通过：清零缺账单/差异后方可月结" : ""} onClick={() => setState("月结")}>月结（软关账）</button>
              <button className="btn primary" disabled={busy || 已关账 || !齐全} title={!齐全 ? "门禁未通过" : ""} onClick={() => setState("正式锁账")}>关账 · 冻结快照</button>
              {已关账 && s.变更?.changed && <button className="btn" disabled={busy} onClick={() => setState("正式锁账")}>重新冻结快照（接受为新基线）</button>}
            </div>
            {!齐全 && <div style={{ color: "var(--red)", fontSize: 12, marginTop: 8 }}>门禁未通过：尚有 {s.对账.缺账单} 笔缺账单/漏录、{s.对账.差异} 笔金额差异，到 <a href="/reconciliation" style={{ color: "var(--accent)" }}>② 对账</a> 处理后再月结。</div>}
          </div>

          {/* 快照基线 */}
          {snap && (
            <>
              <h3>快照基线（关账冻结值 · 案件 {snap.案件数}）</h3>
              <table className="report-table" style={{ maxWidth: 640 }}>
                <thead><tr><th>维度</th><th className="num">毛利</th><th className="num">贩管费</th><th className="num">净利</th></tr></thead>
                <tbody>
                  {(["全社", "中国", "日本"] as const).map((k) => (
                    <tr key={k}><td>{k}</td><td className="num">{yen(snap[k].毛利)}</td><td className="num">{yen(snap[k].贩管费)}</td><td className="num strong">{yen(snap[k].净利)}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {s.审计 && s.审计.length > 0 && (
            <>
              <h3>内控审计日志（近 15 条）</h3>
              <table className="report-table" style={{ maxWidth: 720 }}>
                <thead><tr><th>时间</th><th>用户</th><th>动作</th><th>对象</th></tr></thead>
                <tbody>
                  {s.审计.map((a, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12 }}>{a.时间?.replace("T", " ").slice(0, 16)}</td>
                      <td>{a.用户}</td><td>{a.动作}</td><td style={{ color: "var(--muted)" }}>{a.对象类型}/{a.对象id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return <div className="kpi"><div className="kpi-label">{label}</div><div className="kpi-value" style={color ? { color } : undefined}>{value}</div></div>;
}
