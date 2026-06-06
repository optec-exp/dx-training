"use client";

import { useRouter } from "next/navigation";

// 期间选择：累计(财年4月起) / 季度 / 各月多选。
export default function PeriodPicker({ available, selected, basePath = "/" }: { available: string[]; selected: string[]; basePath?: string }) {
  const router = useRouter();
  const go = (months: string[] | null) => router.push(months && months.length ? `${basePath}?months=${months.join(",")}` : basePath);

  // 财年（取最新选定/可用月）
  const latest = (selected.length ? selected : available).slice(-1)[0] || "2026-05";
  const fy = (() => { const [y, m] = latest.split("-").map(Number); return m >= 4 ? y : y - 1; })();
  const Q: Record<string, string[]> = {
    Q1: [`${fy}-04`, `${fy}-05`, `${fy}-06`], Q2: [`${fy}-07`, `${fy}-08`, `${fy}-09`],
    Q3: [`${fy}-10`, `${fy}-11`, `${fy}-12`], Q4: [`${fy + 1}-01`, `${fy + 1}-02`, `${fy + 1}-03`],
  };
  const sel = new Set(selected);
  const isYTD = selected.length > 1; // 简单判断：默认累计时 selected=财年多月

  const toggle = (m: string) => { const s = new Set(sel); s.has(m) ? s.delete(m) : s.add(m); go([...s].sort()); };
  const chipStyle = (active: boolean) => ({ padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: "1px solid", borderColor: active ? "var(--accent)" : "var(--border)", background: active ? "var(--accent-soft)" : "var(--panel)", color: active ? "var(--accent)" : "var(--muted)" } as const);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ ...chipStyle(isYTD), fontWeight: 600 }} onClick={() => go(null)}>累计(FY{fy})</span>
      {Object.entries(Q).map(([q, ms]) => {
        const avail = ms.filter((m) => available.includes(m));
        if (avail.length === 0) return null;
        const active = avail.every((m) => sel.has(m)) && selected.length === avail.length;
        return <span key={q} style={chipStyle(active)} onClick={() => go(avail)}>{q}</span>;
      })}
      <span style={{ color: "var(--border)" }}>|</span>
      {available.map((m) => (
        <span key={m} style={chipStyle(sel.has(m))} onClick={() => toggle(m)}>{m.slice(5)}月</span>
      ))}
    </div>
  );
}
