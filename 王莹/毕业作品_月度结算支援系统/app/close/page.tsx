"use client";

import { useEffect, useState, useCallback } from "react";

interface Status {
  month: string;
  对账: { total: number; matched: number; 差异: number; 缺账单: number };
  同步差异: number;
  锁定状态: string;
  正式锁账日: string;
  审计?: { 时间: string; 用户: string; 动作: string; 对象类型: string; 对象id: string }[];
}
const STATE_PILL: Record<string, string> = { 进行中: "pill-gray", 月结: "pill-amber", 正式锁账: "pill-green" };

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

  const 齐全 = s ? s.对账.缺账单 === 0 && s.对账.差异 === 0 : false;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>③ 关账 / 锁账</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px 12px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }} />
        {s && <span className={`pill ${STATE_PILL[s.锁定状态]}`}>{s.锁定状态}</span>}
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

          <div className="card" style={{ marginTop: 16, maxWidth: 720 }}>
            <div style={{ marginBottom: 10 }}>
              关账门禁：{齐全 ? <span className="pill pill-green">✓ 齐全，可月结</span> : <span className="pill pill-red">● 有未决差异/缺账单</span>}
            </div>
            <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 14 }}>
              正式锁账日（M+2 月 1 日，宽限 1 个月）：<b>{s.正式锁账日}</b>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn" disabled={busy || s.锁定状态 !== "进行中"} onClick={() => setState("月结")}>月结（软关账）</button>
              <button className="btn primary" disabled={busy || s.锁定状态 === "正式锁账"} onClick={() => setState("正式锁账")}>正式锁账</button>
              <button className="btn" disabled={busy || s.锁定状态 === "进行中"} onClick={() => setState("进行中")}>解锁</button>
            </div>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 12 }}>
            说明：硬性规则"拿全所有成本才能关账"——缺账单/差异清零后方宜月结。正式锁账后快照冻结、修改需解锁（快照冻结为 P1）。
          </p>

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
