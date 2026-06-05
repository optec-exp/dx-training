"use client";

import { useState } from "react";

interface ReconRow {
  opt_no: string;
  币种: string;
  billAmount: number;
  kintoneAmount: number | null;
  diff: number | null;
  status: "匹配" | "金额差异" | "缺账单或漏录";
}
interface ReconResp {
  bill: { 供应商: string; 币种: string; 类型: string; 行数: number };
  result: { rows: ReconRow[]; summary: { matched: number; diff: number; missing: number; total: number } };
}

const STATUS_STYLE: Record<string, { color: string; icon: string }> = {
  匹配: { color: "var(--green)", icon: "✅" },
  金额差异: { color: "var(--amber)", icon: "⚠️" },
  缺账单或漏录: { color: "var(--red)", icon: "🟡" },
};

export default function ReconciliationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("2026-05");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<ReconResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!file) { setError("请先选择账单 PDF"); return; }
    setBusy(true); setError(null); setData(null);
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
        <input value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px 12px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", width: 110 }} />
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
          <p style={{ color: "var(--muted)", fontSize: 13 }}>
            账单：{data.bill.供应商}｜{data.bill.币种}｜{data.bill.类型}｜{data.bill.行数} 行
          </p>
          <table className="report-table">
            <thead>
              <tr><th>OPT 编号</th><th className="num">账单金额</th><th className="num">Kintone 金额</th><th className="num">差额</th><th>状态</th></tr>
            </thead>
            <tbody>
              {data.result.rows.map((r) => (
                <tr key={r.opt_no}>
                  <td>{r.opt_no}</td>
                  <td className="num">{yen(r.billAmount, r.币种)}</td>
                  <td className="num">{yen(r.kintoneAmount, r.币种)}</td>
                  <td className="num">{r.diff == null ? "—" : r.diff.toLocaleString()}</td>
                  <td style={{ color: STATUS_STYLE[r.status].color }}>{STATUS_STYLE[r.status].icon} {r.status}</td>
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
