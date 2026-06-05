"use client";

import { useState } from "react";

// 可折叠区块（标题可点击展开/收起），避免列表占满页面。
export default function Collapsible({ title, right, defaultOpen = false, children }: { title: React.ReactNode; right?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ padding: 0, marginTop: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", userSelect: "none", background: "var(--panel-2)" }}>
        <div style={{ fontWeight: 650 }}><span style={{ color: "var(--accent)", marginRight: 8 }}>{open ? "▾" : "▸"}</span>{title}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{right}</div>
      </div>
      {open && <div style={{ padding: "14px 16px" }}>{children}</div>}
    </div>
  );
}
