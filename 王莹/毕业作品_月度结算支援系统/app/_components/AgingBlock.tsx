"use client";

import { useState } from "react";
import { BarCard } from "@/app/_components/Charts";
import type { AgingReport } from "@/lib/treasury";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const PAGE = 10;
const BUCKET_COLORS: Record<string, string> = {
  "未到期": "#5a7d63", "0-30": "#cd952f", "31-60": "#c98b5a", "61-90": "#b56b5e", "90+": "#a45d63",
};

export default function AgingBlock({ title, report, labelName, accent }: { title: string; report: AgingReport; labelName: string; accent: string }) {
  const [sel, setSel] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  if (report.count === 0) return <div className="warn-box" style={{ marginTop: 20 }}>{title}：暂无数据（数据录入页同步应收应付）。</div>;

  function pick(bucket: string) { setSel((cur) => (cur === bucket ? null : bucket)); setPage(0); }

  const inBucket = sel ? report.records.filter((r) => r.bucket === sel) : [];
  const pages = Math.max(1, Math.ceil(inBucket.length / PAGE));
  const view = inBucket.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div className="kpi-row">
        <div className="kpi"><div className="kpi-label">{title}总额</div><div className="kpi-value" style={{ fontSize: 20 }}>{yen(report.total)}</div></div>
        <div className="kpi"><div className="kpi-label">超期金额</div><div className="kpi-value" style={{ fontSize: 20, color: "var(--red)" }}>{yen(report.overdueAmt)}</div></div>
        <div className="kpi"><div className="kpi-label">超期笔数</div><div className="kpi-value" style={{ color: "var(--red)" }}>{report.overdueCount}</div></div>
        <div className="kpi"><div className="kpi-label">总笔数</div><div className="kpi-value">{report.count}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 14, alignItems: "start" }}>
        <BarCard title="账龄分布（金额 · 点柱看明细）" data={report.buckets as unknown as Record<string, unknown>[]} xKey="bucket" barKey="amt" onBarClick={pick} activeCat={sel} colors={BUCKET_COLORS} />

        {sel === null ? (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 650, marginBottom: 8 }}>Top 10 {labelName} <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}>· 点左侧柱子看某账龄全部记录</span></div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
              <tbody>
                {report.topCustomers.map((c) => (
                  <tr key={c.name}><td style={{ padding: "3px 0" }}>{c.name}</td><td style={{ padding: "3px 0", textAlign: "right", fontWeight: 600, color: accent }}>{yen(c.amt)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontWeight: 650 }}>
                <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: BUCKET_COLORS[sel] || accent, marginRight: 6 }} />
                账龄「{sel}{sel === "未到期" ? "" : " 天"}」· 共 {inBucket.length} 条
              </div>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--accent)", cursor: "pointer", fontSize: 12, padding: "3px 10px" }}>← 返回 Top10</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
              <thead><tr>{[labelName, "金额", "状态", "预计收付日"].map((h, i) => <th key={i} style={{ textAlign: i === 1 ? "right" : "left", color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
              <tbody>
                {view.map((r, i) => (
                  <tr key={i}>
                    <td style={{ padding: "3px 6px" }}>{r.name}</td>
                    <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: 600, color: accent }}>{yen(r.金额)}</td>
                    <td style={{ padding: "3px 6px" }}>{r.超期 ? <span className="pill pill-red">超期</span> : <span className="pill pill-green">未到期</span>}</td>
                    <td style={{ padding: "3px 6px", color: "var(--muted)" }}>{r.due || "—"}</td>
                  </tr>
                ))}
                {view.length === 0 && <tr><td colSpan={4} style={{ color: "var(--muted)", padding: "6px" }}>该账龄无记录</td></tr>}
              </tbody>
            </table>
            {inBucket.length > PAGE && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
                <span style={{ color: "var(--muted)" }}>第 {page + 1}/{pages} 页 · 共 {inBucket.length} 条</span>
                <span style={{ display: "flex", gap: 6 }}>
                  <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={pgBtn(page === 0)}>上一页</button>
                  <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} style={pgBtn(page >= pages - 1)}>下一页</button>
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function pgBtn(disabled: boolean): React.CSSProperties {
  return { background: "none", border: "1px solid var(--border)", borderRadius: 6, color: disabled ? "var(--muted)" : "var(--accent)", cursor: disabled ? "default" : "pointer", fontSize: 12, padding: "3px 10px", opacity: disabled ? 0.5 : 1 };
}
