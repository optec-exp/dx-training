"use client";

import { useState } from "react";

interface ReconRow {
  opt_no: string;
  kintone供应商: string | null;
  币种: string;
  billAmount: number;
  kintoneAmount: number | null;
  diff: number | null;
  status: "匹配" | "金额差异" | "缺账单或漏录" | "待人工核对";
  note?: string;
}
interface ReconResp {
  bill: { 供应商: string; 币种: string; 类型: string; 行数: number };
  result: { rows: ReconRow[]; summary: { matched: number; diff: number; missing: number; total: number } };
}

const STATUS_STYLE: Record<string, { cls: string; icon: string }> = {
  匹配: { cls: "pill-green", icon: "✓" },
  金额差异: { cls: "pill-amber", icon: "⚠" },
  待人工核对: { cls: "pill-amber", icon: "🔍" },
  缺账单或漏录: { cls: "pill-red", icon: "●" },
};

export default function ReconciliationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("2026-05");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ReconResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expl, setExpl] = useState<{ opt_no: string; 疑因: string; 建议: string }[] | null>(null);
  const [explBusy, setExplBusy] = useState(false);

  async function explain() {
    if (!data) return;
    setExplBusy(true); setExpl(null);
    try {
      const rows = data.result.rows.filter((r) => r.status !== "匹配");
      const res = await fetch("/api/reconcile/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
      const j = await res.json();
      setExpl(j.explanations || []);
    } catch { setExpl([]); } finally { setExplBusy(false); }
  }

  async function run() {
    if (!file) { setError("请先选择账单 PDF"); return; }
    setBusy(true); setError(null); setData(null); setExpl(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("month", month);
      const res = await fetch("/api/reconcile", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const yen = (n: number | null, cur: string) => (n == null ? "—" : `${cur} ${n.toLocaleString()}`);

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>② 对账 / 差异工作台</h1>
      <p style={{ color: "var(--muted)" }}>
        上传供应商账单（PDF），AI 解析后按 OPT+供应商+币种 与 Kintone 成本自动比对。
      </p>

      <div style={{ display: "flex", gap: 12, alignItems: "center", margin: "20px 0", flexWrap: "wrap" }}>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <label>利润月：</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px 12px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }} />
        <button className="btn primary" disabled={busy} onClick={run}>{busy ? "AI 解析对账中…" : "解析并对账"}</button>
      </div>

      {error && <div className="warn-box" style={{ borderColor: "var(--red)", color: "var(--red)" }}>{error}</div>}

      {data && (
        <>
          <div className="kpi-row" style={{ marginBottom: 16 }}>
            <Kpi label="✅ 匹配" value={data.result.summary.matched} color="var(--green)" />
            <Kpi label="⚠️ 金额差异" value={data.result.summary.diff} color="var(--amber)" />
            <Kpi label="🟡 缺账单/漏录" value={data.result.summary.missing} color="var(--red)" />
            <Kpi label="共计" value={data.result.summary.total} />
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13, display: "flex", gap: 12, alignItems: "center" }}>
            账单：{data.bill.供应商}｜{data.bill.币种}｜{data.bill.类型}｜{data.bill.行数} 行
            {(data.result.summary.diff + data.result.summary.missing) > 0 &&
              <button className="btn" disabled={explBusy} onClick={explain}>{explBusy ? "AI 解读中…" : "🤖 AI 解读差异"}</button>}
          </p>
          {expl && expl.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 650, marginBottom: 8 }}>AI 差异疑因建议</div>
              <table className="report-table" style={{ boxShadow: "none", border: "none", margin: 0 }}>
                <thead><tr><th>OPT</th><th>疑因</th><th>建议</th></tr></thead>
                <tbody>{expl.map((e, i) => (<tr key={i}><td>{e.opt_no}</td><td>{e.疑因}</td><td style={{ color: "var(--muted)" }}>{e.建议}</td></tr>))}</tbody>
              </table>
            </div>
          )}
          <table className="report-table">
            <thead>
              <tr><th>OPT 编号</th><th>匹配供应商</th><th className="num">账单金额</th><th className="num">Kintone 金额</th><th className="num">差额</th><th>状态</th></tr>
            </thead>
            <tbody>
              {data.result.rows.map((r) => (
                <tr key={r.opt_no} className={r.status !== "匹配" ? "flag" : undefined}>
                  <td>{r.opt_no}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{r.kintone供应商 || "—"}</td>
                  <td className="num">{yen(r.billAmount, r.币种)}</td>
                  <td className="num">{yen(r.kintoneAmount, r.币种)}</td>
                  <td className={"num" + (r.diff && r.diff !== 0 ? " neg" : "")}>{r.diff == null ? "—" : r.diff.toLocaleString()}</td>
                  <td>
                    <span className={`pill ${STATUS_STYLE[r.status].cls}`}>{STATUS_STYLE[r.status].icon} {r.status}</span>
                    {r.note && <span style={{ color: "var(--muted)", fontSize: 11 }}> {r.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}
