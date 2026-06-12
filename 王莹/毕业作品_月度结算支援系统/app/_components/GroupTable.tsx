"use client";

import { useState } from "react";
import type { GroupRow } from "@/lib/profit";

const DIMS = ["見積", "国别", "输出", "输入", "自社通関費"] as const;
const yen = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");

export default function GroupTable({ groups }: { groups: GroupRow[] }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // 标注每个缩进行的父分组 + 哪些父分组有子行（可折叠）
  let curParent = "";
  const rows = groups.map((g) => {
    if (!g.indent) curParent = g.name;
    return { ...g, parent: g.indent ? curParent : null };
  });
  const hasChildren = new Set(rows.filter((r) => r.parent).map((r) => r.parent as string));
  const maxTotal = Math.max(...rows.filter((r) => !r.indent).map((r) => r.total), 1);

  const toggle = (name: string) =>
    setCollapsed((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });

  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>小组</th>
          <th className="num">合计</th>
          {DIMS.map((d) => <th key={d} className="num">{d}</th>)}
          <th style={{ width: "26%" }}>占比</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          if (r.indent && r.parent && collapsed.has(r.parent)) return null;
          const foldable = !r.indent && hasChildren.has(r.name);
          return (
            <tr key={i} style={r.indent ? { color: "var(--muted)" } : undefined}>
              <td
                style={{ paddingLeft: r.indent ? 24 : undefined, cursor: foldable ? "pointer" : undefined, userSelect: "none" }}
                onClick={foldable ? () => toggle(r.name) : undefined}
              >
                {foldable && <span style={{ color: "var(--accent)", marginRight: 6 }}>{collapsed.has(r.name) ? "▸" : "▾"}</span>}
                {r.name}
              </td>
              <td className="num strong">{yen(r.total)}</td>
              {DIMS.map((d) => <td key={d} className="num">{yen(r[d])}</td>)}
              <td>{!r.indent && <div className="bar" style={{ width: `${(r.total / maxTotal) * 100}%` }} />}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
