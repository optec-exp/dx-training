"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

interface Hang { 客户: string; 金额: number }
interface Bad { id: string; 客户: string; 金额: number; 备注: string; 标记时间: string }

export default function BadDebtCards({ 长期挂账, 坏账 }: { 长期挂账: Hang[]; 坏账: Bad[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [memo, setMemo] = useState<Record<string, string>>({});

  async function mark(h: Hang) {
    setBusy(h.客户);
    try {
      await fetch("/api/bad-debt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 客户: h.客户, 金额: h.金额, 备注: memo[h.客户] || "" }) });
      router.refresh();
    } finally { setBusy(null); }
  }
  async function restore(b: Bad) {
    setBusy(b.id);
    try { await fetch(`/api/bad-debt?id=${b.id}`, { method: "DELETE" }); router.refresh(); } finally { setBusy(null); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16 }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 650, marginBottom: 8 }}>⏳ 长期挂账（应收 90+ 超期 · 按客户）</div>
        {长期挂账.length === 0 ? <div style={{ color: "var(--green)", fontSize: 13 }}>✓ 无长期挂账</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
            <thead><tr>{["客户", "应收金额", ""].map((h, i) => <th key={i} style={{ textAlign: i === 1 ? "right" : "left", color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
            <tbody>{长期挂账.map((r) => (
              <tr key={r.客户}>
                <td style={{ padding: "4px 6px" }}>{r.客户}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: "var(--red)" }}>{yen(r.金额)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <input placeholder="备注" value={memo[r.客户] || ""} onChange={(e) => setMemo({ ...memo, [r.客户]: e.target.value })} style={{ width: 80, padding: "2px 6px", background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", fontSize: 11, marginRight: 4 }} />
                  <button disabled={busy === r.客户} onClick={() => mark(r)} style={{ background: "var(--red)", border: "none", borderRadius: 6, color: "#fff", cursor: "pointer", fontSize: 11, padding: "3px 8px", opacity: busy === r.客户 ? 0.5 : 1 }}>{busy === r.客户 ? "…" : "标记坏账"}</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: 14, borderLeft: "4px solid var(--red)" }}>
        <div style={{ fontWeight: 650, marginBottom: 8 }}>💀 坏账（本系统标记 · 已从挂账剔除）<span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 400 }}>　合计 {yen(坏账.reduce((s, b) => s + b.金额, 0))}</span></div>
        {坏账.length === 0 ? <div style={{ color: "var(--muted)", fontSize: 13 }}>暂无坏账标记</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontVariantNumeric: "tabular-nums", fontSize: 13 }}>
            <thead><tr>{["客户", "金额", "备注", "标记日", ""].map((h, i) => <th key={i} style={{ textAlign: i === 1 ? "right" : "left", color: "var(--muted)", fontWeight: 600, fontSize: 11, padding: "2px 6px" }}>{h}</th>)}</tr></thead>
            <tbody>{坏账.map((b) => (
              <tr key={b.id}>
                <td style={{ padding: "4px 6px" }}>{b.客户}</td>
                <td style={{ padding: "4px 6px", textAlign: "right", color: "var(--red)" }}>{yen(b.金额)}</td>
                <td style={{ padding: "4px 6px", color: "var(--muted)" }}>{b.备注 || "—"}</td>
                <td style={{ padding: "4px 6px", color: "var(--muted)", fontSize: 11 }}>{b.标记时间.slice(0, 10)}</td>
                <td style={{ padding: "4px 6px", textAlign: "right" }}>
                  <button disabled={busy === b.id} onClick={() => restore(b)} title="撤回，重新计入长期挂账" style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, color: "var(--muted)", cursor: "pointer", fontSize: 11, padding: "3px 8px" }}>{busy === b.id ? "…" : "恢复"}</button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
