"use client";

import { useEffect, useState } from "react";

interface Inv { id: string; 品种: string; 投资额: number; 币种: string; 收益率: number; 到期日: string | null; 流动性: string; 状态: string }
interface Advice { hsbcUsd: number; 已投USD: number; 近期净现金流USD: number; 可投USD: number; 笔数: number; 起投: number; 状态: string; 文案: string }
const yen = (n: number) => Math.round(n).toLocaleString("ja-JP");
const usd = (n: number) => "$" + Math.round(n).toLocaleString();

export default function InvestmentPanel() {
  const [rows, setRows] = useState<Inv[]>([]);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [f, setF] = useState({ 品种: "", 投资额: "", 币种: "USD", 收益率: "", 到期日: "", 流动性: "可赎回" });
  const [busy, setBusy] = useState(false);

  async function load() { const r = await fetch("/api/investment").then((x) => x.json()).catch(() => ({ rows: [] })); setRows(r.rows || []); setAdvice(r.advice || null); }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!f.品种 || !f.投资额) return;
    setBusy(true);
    try { await fetch("/api/investment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); setF({ 品种: "", 投资额: "", 币种: "JPY", 收益率: "", 到期日: "", 流动性: "可赎回" }); load(); }
    finally { setBusy(false); }
  }

  const total = rows.reduce((s, r) => s + (Number(r.投资额) || 0), 0);
  const wYield = total ? rows.reduce((s, r) => s + (Number(r.投资额) || 0) * (Number(r.收益率) || 0), 0) / total : 0;
  const daysTo = (d: string | null) => d ? Math.floor((new Date(d + "T00:00:00+09:00").getTime() - Date.now()) / 86400000) : 999999;
  const soon = rows.filter((r) => { const dd = daysTo(r.到期日); return dd >= 0 && dd <= 30; });
  const soonAmt = soon.reduce((s, r) => s + (Number(r.投资额) || 0), 0);

  const adviceColor = advice?.状态 === "不足" ? "var(--red)" : advice?.状态 === "需留存" ? "var(--amber)" : "var(--green)";

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>闲置资金投资台账 <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}>· HSBC USD 账户 · 起投 $1,000,000</span></h3>
      {advice && (
        <div className="card" style={{ padding: 16, marginBottom: 14, borderLeft: `4px solid ${adviceColor}` }}>
          <div className="kpi-row" style={{ marginBottom: 8 }}>
            <div className="kpi"><div className="kpi-label">HSBC USD 余额</div><div className="kpi-value" style={{ fontSize: 20 }}>{usd(advice.hsbcUsd)}</div></div>
            <div className="kpi"><div className="kpi-label">已投资(USD)</div><div className="kpi-value" style={{ fontSize: 20 }}>{usd(advice.已投USD)}</div></div>
            <div className="kpi"><div className="kpi-label">未来应收应付净流入</div><div className="kpi-value" style={{ fontSize: 20, color: advice.近期净现金流USD >= 0 ? "var(--green)" : "var(--red)" }}>{usd(advice.近期净现金流USD)}</div></div>
            <div className="kpi primary"><div className="kpi-label">建议可投额度</div><div className="kpi-value" style={{ color: adviceColor }}>{usd(advice.可投USD)}</div></div>
          </div>
          <div style={{ fontSize: 13, color: adviceColor, fontWeight: 600 }}>💡 {advice.文案}</div>
        </div>
      )}
      {rows.length > 0 && (
        <div className="kpi-row" style={{ marginBottom: 12 }}>
          <div className="kpi primary"><div className="kpi-label">投资总额</div><div className="kpi-value">¥{yen(total)}</div></div>
          <div className="kpi"><div className="kpi-label">加权收益率</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--green)" }}>{wYield.toFixed(2)}%</div></div>
          <div className="kpi"><div className="kpi-label">近30天到期</div><div className="kpi-value" style={{ fontSize: 20, color: soon.length ? "var(--amber)" : undefined }}>¥{yen(soonAmt)}</div></div>
          <div className="kpi"><div className="kpi-label">笔数</div><div className="kpi-value">{rows.length}</div></div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
        <I label="品种" v={f.品种} set={(x) => setF({ ...f, 品种: x })} w={140} />
        <I label="投资额" v={f.投资额} set={(x) => setF({ ...f, 投资额: x })} w={120} type="number" />
        <I label="币种" v={f.币种} set={(x) => setF({ ...f, 币种: x })} w={70} />
        <I label="收益率%" v={f.收益率} set={(x) => setF({ ...f, 收益率: x })} w={80} type="number" />
        <I label="到期日" v={f.到期日} set={(x) => setF({ ...f, 到期日: x })} w={140} type="date" />
        <I label="流动性" v={f.流动性} set={(x) => setF({ ...f, 流动性: x })} w={100} />
        <button className="btn primary" disabled={busy} onClick={save}>{busy ? "…" : "添加"}</button>
      </div>
      <table className="report-table" style={{ maxWidth: 820 }}>
        <thead><tr><th>品种</th><th className="num">投资额</th><th>币种</th><th className="num">收益率</th><th>到期日</th><th>流动性</th></tr></thead>
        <tbody>
          {rows.map((r) => { const dd = daysTo(r.到期日); const near = dd >= 0 && dd <= 30; return (<tr key={r.id}><td>{r.品种}</td><td className="num strong">{yen(r.投资额)}</td><td>{r.币种}</td><td className="num">{r.收益率}%</td><td style={near ? { color: "var(--amber)", fontWeight: 600 } : undefined}>{r.到期日 || "—"}{near && ` (${dd}天)`}</td><td>{r.流动性}</td></tr>); })}
          {rows.length === 0 && <tr><td colSpan={6} style={{ color: "var(--muted)" }}>暂无，录入闲置资金投资</td></tr>}
          {rows.length > 0 && <tr><td className="strong">合计</td><td className="num strong">{yen(total)}</td><td colSpan={4} /></tr>}
        </tbody>
      </table>
      <style>{`.inp2{padding:7px 10px;background:var(--panel);border:1px solid var(--border);border-radius:8px;color:var(--text)}`}</style>
    </div>
  );
}

function I({ label, v, set, w, type = "text" }: { label: string; v: string; set: (x: string) => void; w: number; type?: string }) {
  return <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12, color: "var(--muted)" }}>{label}<input className="inp2" type={type} value={v} onChange={(e) => set(e.target.value)} style={{ width: w }} /></label>;
}
