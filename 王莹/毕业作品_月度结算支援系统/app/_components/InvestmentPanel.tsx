"use client";

import { useEffect, useState } from "react";

interface Inv { id: string; 品种: string; 投资额: number; 币种: string; 收益率: number; 起息日: string | null; 到期日: string | null; 预计收益: number; 流动性: string; 状态: string }
interface Advice { hsbcUsd: number; 已投USD: number; usd应收: number; usd应付: number; usd净流入: number; 可投USD: number; 笔数: number; 起投: number; 状态: string; 文案: string }
const yen = (n: number) => Math.round(n).toLocaleString("ja-JP");
const usd = (n: number) => "$" + Math.round(n).toLocaleString();

export default function InvestmentPanel() {
  const [rows, setRows] = useState<Inv[]>([]);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [f, setF] = useState({ 品种: "", 投资额: "", 币种: "USD", 收益率: "", 起息日: "", 到期日: "", 预计收益: "", 流动性: "可赎回" });
  const [busy, setBusy] = useState(false);

  async function load() { const r = await fetch("/api/investment").then((x) => x.json()).catch(() => ({ rows: [] })); setRows(r.rows || []); setAdvice(r.advice || null); }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!f.品种 || !f.投资额) return;
    setBusy(true);
    try { await fetch("/api/investment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, 预计收益: f.预计收益 || estReturn }) }); setF({ 品种: "", 投资额: "", 币种: "USD", 收益率: "", 起息日: "", 到期日: "", 预计收益: "", 流动性: "可赎回" }); load(); }
    finally { setBusy(false); }
  }

  async function del(r: Inv) {
    if (!confirm(`删除投资记录「${r.品种}」¥${yen(r.投资额)}？`)) return;
    await fetch(`/api/investment?id=${r.id}`, { method: "DELETE" }); load();
  }

  const daysTo = (d: string | null) => d ? Math.floor((new Date(d + "T00:00:00+09:00").getTime() - Date.now()) / 86400000) : 999999;
  const active = rows.filter((r) => daysTo(r.到期日) >= 0); // 未到期 = 在投
  const total = rows.reduce((s, r) => s + (Number(r.投资额) || 0), 0); // 全部（表尾合计）
  const activeTotal = active.reduce((s, r) => s + (Number(r.投资额) || 0), 0); // 在投总额
  const activeYield = activeTotal ? active.reduce((s, r) => s + (Number(r.投资额) || 0) * (Number(r.收益率) || 0), 0) / activeTotal : 0;
  const activeEst = active.reduce((s, r) => s + (Number(r.预计收益) || 0), 0);
  const soon = active.filter((r) => daysTo(r.到期日) <= 30);
  const soonAmt = soon.reduce((s, r) => s + (Number(r.投资额) || 0), 0);
  // 预计收益：录入后已知，手工填；未填时按 投资额×年化×(到期−起息)/365 估算占位
  const daysBetween = (a: string, b: string) => (a && b) ? Math.max(0, Math.round((new Date(b + "T00:00:00+09:00").getTime() - new Date(a + "T00:00:00+09:00").getTime()) / 86400000)) : 0;
  const estReturn = (() => { const amt = Number(f.投资额) || 0, rate = Number(f.收益率) || 0, d = daysBetween(f.起息日, f.到期日); return amt && rate && d ? String(Math.round(amt * rate / 100 * d / 365)) : ""; })();
  const totalEst = rows.reduce((s, r) => s + (Number(r.预计收益) || 0), 0);

  const adviceColor = advice?.状态 === "不足" ? "var(--red)" : advice?.状态 === "需留存" ? "var(--amber)" : "var(--green)";

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>闲置资金投资台账 <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}>· HSBC USD 账户 · 起投 $1,000,000</span></h3>
      {advice && (
        <div className="card" style={{ padding: 16, marginBottom: 14, borderLeft: `4px solid ${adviceColor}` }}>
          <div className="kpi-row" style={{ marginBottom: 8 }}>
            <div className="kpi"><div className="kpi-label">HSBC USD 余额</div><div className="kpi-value" style={{ fontSize: 20 }}>{usd(advice.hsbcUsd)}</div></div>
            <div className="kpi"><div className="kpi-label">已投资(USD)</div><div className="kpi-value" style={{ fontSize: 20 }}>{usd(advice.已投USD)}</div></div>
            <div className="kpi"><div className="kpi-label">未来 USD 净流入<span style={{ fontSize: 10 }}>（应收{usd(advice.usd应收)}−应付{usd(advice.usd应付)}）</span></div><div className="kpi-value" style={{ fontSize: 20, color: advice.usd净流入 >= 0 ? "var(--green)" : "var(--red)" }}>{usd(advice.usd净流入)}</div></div>
            <div className="kpi primary"><div className="kpi-label">建议可投额度</div><div className="kpi-value" style={{ color: "#fff" }}>{usd(advice.可投USD)}</div></div>
          </div>
          <div style={{ fontSize: 13, color: adviceColor, fontWeight: 600 }}>💡 {advice.文案}</div>
        </div>
      )}
      {rows.length > 0 && (
        <div className="kpi-row" style={{ marginBottom: 12 }}>
          <div className="kpi primary"><div className="kpi-label">在投总额（未到期）</div><div className="kpi-value">¥{yen(activeTotal)}</div></div>
          <div className="kpi"><div className="kpi-label">加权收益率（在投）</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--green)" }}>{activeYield.toFixed(2)}%</div></div>
          <div className="kpi"><div className="kpi-label">预计收益（在投）</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--green)" }}>¥{yen(activeEst)}</div></div>
          <div className="kpi"><div className="kpi-label">近30天到期</div><div className="kpi-value" style={{ fontSize: 20, color: soon.length ? "var(--amber)" : undefined }}>¥{yen(soonAmt)}</div></div>
          <div className="kpi"><div className="kpi-label">在投笔数</div><div className="kpi-value">{active.length}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 400 }}> / 共{rows.length}</span></div></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
        <I label="品种" v={f.品种} set={(x) => setF({ ...f, 品种: x })} w={140} />
        <I label="投资额" v={f.投资额} set={(x) => setF({ ...f, 投资额: x })} w={120} type="number" />
        <I label="币种" v={f.币种} set={(x) => setF({ ...f, 币种: x })} w={70} />
        <I label="年化收益率%" v={f.收益率} set={(x) => setF({ ...f, 收益率: x })} w={90} type="number" />
        <I label="起息日" v={f.起息日} set={(x) => setF({ ...f, 起息日: x })} w={140} type="date" />
        <I label="到期日" v={f.到期日} set={(x) => setF({ ...f, 到期日: x })} w={140} type="date" />
        <I label="预计收益" v={f.预计收益} set={(x) => setF({ ...f, 预计收益: x })} w={120} type="number" placeholder={estReturn ? `估算 ${Math.round(Number(estReturn)).toLocaleString()}` : "金额"} />
        <I label="流动性" v={f.流动性} set={(x) => setF({ ...f, 流动性: x })} w={100} />
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? "…" : "添加"}</button>
      </div>
      <table className="report-table" style={{ maxWidth: 980 }}>
        <thead><tr><th>品种</th><th className="num">投资额</th><th>币种</th><th className="num">年化收益率</th><th>起息日</th><th>到期日</th><th className="num">预计收益</th><th>流动性</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => { const dd = daysTo(r.到期日); const near = dd >= 0 && dd <= 30; const matured = dd < 0; return (<tr key={r.id} style={matured ? { opacity: 0.5 } : undefined}><td>{r.品种}</td><td className="num strong">{yen(r.投资额)}</td><td>{r.币种}</td><td className="num">{r.收益率}%</td><td>{r.起息日 || "—"}</td><td style={near ? { color: "var(--amber)", fontWeight: 600 } : undefined}>{r.到期日 || "—"}{near && ` (${dd}天)`}{matured && " 已到期"}</td><td className="num" style={{ color: "var(--green)" }}>{r.预计收益 ? yen(r.预计收益) : "—"}</td><td>{r.流动性}</td><td><button onClick={() => del(r)} title="删除" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--red)", cursor: "pointer", fontSize: 12, padding: "2px 8px" }}>删除</button></td></tr>); })}
          {rows.length === 0 && <tr><td colSpan={9} style={{ color: "var(--muted)" }}>暂无，录入闲置资金投资</td></tr>}
          {rows.length > 0 && <tr><td className="strong">合计（全部）</td><td className="num strong">{yen(total)}</td><td colSpan={4} /><td className="num strong" style={{ color: "var(--green)" }}>{yen(totalEst)}</td><td colSpan={2} /></tr>}
        </tbody>
      </table>
      <style>{`.inp2{padding:7px 10px;background:var(--panel);border:1px solid var(--border);border-radius:8px;color:var(--text)}`}</style>
    </div>
  );
}

function I({ label, v, set, w, type = "text", placeholder }: { label: string; v: string; set: (x: string) => void; w: number; type?: string; placeholder?: string }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "var(--muted)" }}>{label}<input className="inp2" type={type} value={v} placeholder={placeholder} onChange={(e) => set(e.target.value)} style={{ width: w }} /></label>;
}
