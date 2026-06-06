"use client";

import { useState, Fragment } from "react";

interface Row { 小组: string; 毛利: number; 贩管费: number; 净利: number }
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function GroupPLTable({ business, budgets }: { business: Row[]; budgets: Record<string, number | null> }) {
  const [open, setOpen] = useState(false);
  const jp = business.filter((b) => b.小组.startsWith("JP DESK"));
  const jpMerged: Row | null = jp.length
    ? { 小组: "JP DESK", 毛利: jp.reduce((s, b) => s + b.毛利, 0), 贩管费: jp.reduce((s, b) => s + b.贩管费, 0), 净利: jp.reduce((s, b) => s + b.净利, 0) }
    : null;
  const jpBudget = budgets["JP DESK"] ?? (jp.some((b) => budgets[b.小组] != null) ? jp.reduce((s, b) => s + (budgets[b.小组] || 0), 0) : null);

  const cell = (r: Row, bud: number | null, opts?: { child?: boolean; expandable?: boolean }) => (
    <>
      <td style={opts?.child ? { paddingLeft: 28, color: "var(--muted)" } : undefined}>
        {opts?.expandable && <span style={{ color: "var(--accent)", marginRight: 6, cursor: "pointer" }}>{open ? "▾" : "▸"}</span>}
        {r.小组}
      </td>
      <td className="num">{yen(r.毛利)}</td>
      <td className="num">{yen(r.贩管费)}</td>
      <td className={"num strong" + (r.净利 < 0 ? " neg" : "")}>{yen(r.净利)}</td>
      <td className="num">{bud == null ? "—" : yen(bud)}</td>
      <td className={"num" + (bud != null && r.净利 - bud < 0 ? " neg" : "")}>{bud == null ? "—" : yen(r.净利 - bud)}</td>
      <td className="num">{bud ? ((r.净利 / bud) * 100).toFixed(0) + "%" : "—"}</td>
    </>
  );

  return (
    <table className="report-table" style={{ maxWidth: 900, boxShadow: "none", margin: 0 }}>
      <thead><tr><th>业务小组</th><th className="num">毛利</th><th className="num">贩管费</th><th className="num">净利</th><th className="num">净利预算</th><th className="num">差异</th><th className="num">达成率</th></tr></thead>
      <tbody>
        {business.map((b) => {
          if (b.小组.startsWith("JP DESK")) {
            // 只在第一个 JP DESK* 位置渲染合并行 + 可展开子行
            if (b.小组 !== jp[0].小组) return null;
            return (
              <Fragment key="jpdesk">
                <tr onClick={() => setOpen((o) => !o)} style={{ cursor: "pointer" }}>{cell(jpMerged!, jpBudget, { expandable: true })}</tr>
                {open && jp.map((c) => (<tr key={c.小组} style={{ background: "var(--panel-2)" }}>{cell(c, budgets[c.小组] ?? null, { child: true })}</tr>))}
              </Fragment>
            );
          }
          return <tr key={b.小组}>{cell(b, budgets[b.小组] ?? null)}</tr>;
        })}
      </tbody>
    </table>
  );
}
