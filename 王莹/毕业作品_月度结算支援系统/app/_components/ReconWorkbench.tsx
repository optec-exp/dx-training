"use client";

import { useEffect, useState, useCallback } from "react";

interface Row { id: string; opt_no: string; 供应商: string; 账单金额_原币: number; kintone金额_原币: number | null; 差额: number | null; 差异类型: string; 状态: string; 利润月: string }
const yen = (n: number | null) => (n == null ? "—" : Math.round(n).toLocaleString("ja-JP"));
const STATE: Record<string, string> = { 待复核: "pill-amber", 确认无误: "pill-green", 待代理改单: "pill-red", 已解决: "pill-green" };

export default function ReconWorkbench() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/reconcile/review").then((x) => x.json()).catch(() => ({ rows: [] }));
    setRows(r.rows || []); setLoaded(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function mark(id: string, 状态: string) {
    await fetch("/api/reconcile/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, 状态 }) });
    load();
  }

  if (!loaded) return null;
  return (
    <div style={{ marginTop: 28 }}>
      <h3 style={{ marginTop: 0 }}>差异工作台（历史待处理 · {rows.length} 条）</h3>
      {rows.length === 0 ? (
        <div style={{ color: "var(--green)" }}>✓ 无待处理差异</div>
      ) : (
        <table className="report-table">
          <thead><tr><th>利润月</th><th>OPT</th><th>供应商</th><th className="num">账单</th><th className="num">Kintone</th><th className="num">差额</th><th>类型</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.状态 === "待复核" ? "flag" : undefined}>
                <td>{r.利润月}</td><td>{r.opt_no}</td><td style={{ fontSize: 12, color: "var(--muted)" }}>{r.供应商}</td>
                <td className="num">{yen(r.账单金额_原币)}</td><td className="num">{yen(r.kintone金额_原币)}</td>
                <td className={"num" + (r.差额 ? " neg" : "")}>{yen(r.差额)}</td>
                <td>{r.差异类型}</td>
                <td><span className={`pill ${STATE[r.状态] || "pill-gray"}`}>{r.状态}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {r.状态 === "待复核" ? (
                    <>
                      <button className="btn" style={{ padding: "3px 8px", fontSize: 12, marginRight: 4 }} onClick={() => mark(r.id, "确认无误")}>无误</button>
                      <button className="btn" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => mark(r.id, "待代理改单")}>代理改单</button>
                    </>
                  ) : <button className="btn" style={{ padding: "3px 8px", fontSize: 12 }} onClick={() => mark(r.id, "待复核")}>撤销</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
