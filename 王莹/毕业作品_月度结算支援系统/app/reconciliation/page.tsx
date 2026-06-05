"use client";

import { useState } from "react";
import ReconWorkbench from "@/app/_components/ReconWorkbench";
import MissingBills from "@/app/_components/MissingBills";
import BillHistory from "@/app/_components/BillHistory";
import SupplierMappings from "@/app/_components/SupplierMappings";
import Collapsible from "@/app/_components/Collapsible";

interface ReconRow { opt_no: string; kintone供应商: string | null; 币种: string; billAmount: number; kintoneAmount: number | null; diff: number | null; status: "匹配" | "金额差异" | "Kintone无对应" | "待人工核对"; note?: string }
interface FileResult { filename: string; status: "等待" | "解析中" | "完成" | "失败"; bill?: { 供应商: string; 币种: string; 类型: string; 行数: number }; rows?: ReconRow[]; summary?: { matched: number; diff: number; missing: number; total: number }; error?: string }

const STATUS: Record<string, { cls: string; icon: string }> = {
  匹配: { cls: "pill-green", icon: "✓" }, 金额差异: { cls: "pill-amber", icon: "⚠" }, 待人工核对: { cls: "pill-amber", icon: "🔍" }, Kintone无对应: { cls: "pill-red", icon: "●" },
};
const yen = (n: number | null, c: string) => (n == null ? "—" : `${c} ${n.toLocaleString()}`);

export default function ReconciliationPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [month, setMonth] = useState("2026-05");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);
  const [drag, setDrag] = useState(false);
  const [expl, setExpl] = useState<{ opt_no: string; 疑因: string; 建议: string }[] | null>(null);
  const [explBusy, setExplBusy] = useState(false);
  const [refresh, setRefresh] = useState(0); // 对账/解读后通知下方组件刷新

  function addFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list).filter((f) => /\.(pdf|xlsx?|)$/i.test(f.name));
    setFiles((p) => [...p, ...arr]);
  }

  async function run() {
    if (!files.length) return;
    setBusy(true); setExpl(null);
    const init: FileResult[] = files.map((f) => ({ filename: f.name, status: "等待" }));
    setResults(init);
    const out: FileResult[] = [...init];
    for (let i = 0; i < files.length; i++) {
      out[i] = { ...out[i], status: "解析中" }; setResults([...out]);
      try {
        const fd = new FormData(); fd.append("file", files[i]); fd.append("month", month);
        const res = await fetch("/api/reconcile", { method: "POST", body: fd });
        const j = await res.json();
        if (!res.ok || j.error) throw new Error(j.error || `HTTP ${res.status}`);
        const r = j.results[0];
        if (r.error) throw new Error(r.error);
        out[i] = { filename: files[i].name, status: "完成", bill: r.bill, rows: r.result.rows, summary: r.result.summary };
      } catch (e) { out[i] = { filename: files[i].name, status: "失败", error: e instanceof Error ? e.message : String(e) }; }
      setResults([...out]);
    }
    setBusy(false);
    setRefresh((x) => x + 1); // 对账完成 → 刷新缺账单/工作台/账单历史
  }

  async function explain() {
    const rows = results.flatMap((r) => r.rows || []).filter((r) => r.status !== "匹配");
    if (!rows.length) return;
    setExplBusy(true); setExpl(null);
    try {
      const j = await fetch("/api/reconcile/explain", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows, month }) }).then((x) => x.json());
      setExpl(j.explanations || []);
      setRefresh((x) => x + 1); // 解读已回写工作台备注 → 刷新
    }
    catch { setExpl([]); } finally { setExplBusy(false); }
  }

  const done = results.filter((r) => r.status === "完成").length;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>② 对账 / 差异工作台</h1>
      <p style={{ color: "var(--muted)" }}>上传供应商账单（PDF 或 Excel，可批量），AI 解析后按 OPT+供应商+币种 与 Kintone 成本自动比对。</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
        style={{ border: `2px dashed ${drag ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: 24, textAlign: "center", background: drag ? "var(--accent-soft)" : "var(--panel)", marginBottom: 12 }}
      >
        <div style={{ color: "var(--muted)", marginBottom: 8 }}>📎 拖拽账单文件到此，或</div>
        <input id="fileinput" type="file" accept=".pdf,.xlsx,.xls" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
        <label htmlFor="fileinput" className="btn" style={{ cursor: "pointer" }}>选择文件（PDF / Excel，可多选）</label>
      </div>

      {files.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12, alignItems: "center" }}>
          {files.map((f, i) => (
            <span key={i} className="pill pill-gray">{f.name} <span style={{ cursor: "pointer", marginLeft: 4 }} onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</span></span>
          ))}
          <span style={{ cursor: "pointer", color: "var(--muted)", fontSize: 12 }} onClick={() => setFiles([])}>清空</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <label>利润月：</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px 12px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }} />
        <button className="btn primary" disabled={busy || !files.length} onClick={run}>{busy ? `处理中… (${done}/${files.length})` : `解析并对账（${files.length} 个）`}</button>
        {results.some((r) => (r.summary?.diff || 0) + (r.summary?.missing || 0) > 0) && !busy &&
          <button className="btn" disabled={explBusy} onClick={explain}>{explBusy ? "AI 解读中…" : "🤖 AI 解读差异"}</button>}
      </div>

      {expl && expl.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 650, marginBottom: 8 }}>AI 差异疑因建议</div>
          <table className="report-table" style={{ boxShadow: "none", border: "none", margin: 0 }}>
            <thead><tr><th>OPT</th><th>疑因</th><th>建议</th></tr></thead>
            <tbody>{expl.map((e, i) => (<tr key={i}><td>{e.opt_no}</td><td>{e.疑因}</td><td style={{ color: "var(--muted)" }}>{e.建议}</td></tr>))}</tbody>
          </table>
        </div>
      )}

      {results.map((fr, idx) => (
        <Collapsible key={idx} defaultOpen={results.length <= 2}
          title={<>{statusIcon(fr.status)} {fr.filename}{fr.bill && <span style={{ color: "var(--muted)", fontWeight: 400, marginLeft: 8 }}>· {fr.bill.供应商}｜{fr.bill.币种}｜{fr.bill.行数}行</span>}</>}
          right={fr.summary && <span style={{ fontSize: 13, color: "var(--muted)" }}>✅{fr.summary.matched} ⚠️{fr.summary.diff} 🟡{fr.summary.missing}</span>}>
          {fr.status === "失败" && <div style={{ color: "var(--red)" }}>{fr.error}</div>}
          {fr.rows && (
            <table className="report-table" style={{ boxShadow: "none", margin: 0 }}>
              <thead><tr><th>OPT</th><th>匹配供应商</th><th className="num">账单</th><th className="num">Kintone</th><th className="num">差额</th><th>状态</th></tr></thead>
              <tbody>
                {fr.rows.map((r) => (
                  <tr key={r.opt_no} className={r.status !== "匹配" ? "flag" : undefined}>
                    <td>{r.opt_no}</td><td style={{ fontSize: 12, color: "var(--muted)" }}>{r.kintone供应商 || "—"}</td>
                    <td className="num">{yen(r.billAmount, r.币种)}</td><td className="num">{yen(r.kintoneAmount, r.币种)}</td>
                    <td className={"num" + (r.diff && r.diff !== 0 ? " neg" : "")}>{r.diff == null ? "—" : r.diff.toLocaleString()}</td>
                    <td><span className={`pill ${STATUS[r.status].cls}`}>{STATUS[r.status].icon} {r.status}</span>{r.note && <span style={{ color: "var(--muted)", fontSize: 11 }}> {r.note}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Collapsible>
      ))}

      <MissingBills refresh={refresh} />
      <ReconWorkbench refresh={refresh} />
      <BillHistory refresh={refresh} />
      <SupplierMappings />
    </div>
  );
}

function statusIcon(s: string) { return s === "完成" ? "✅" : s === "失败" ? "❌" : s === "解析中" ? "⏳" : "•"; }
