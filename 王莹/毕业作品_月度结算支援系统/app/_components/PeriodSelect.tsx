"use client";

import { useRouter } from "next/navigation";

// 期间下拉：累计(财年) / 季度 / 单月，单选切换。
export default function PeriodSelect({ available, selected, basePath = "/profit" }: { available: string[]; selected: string[]; basePath?: string }) {
  const router = useRouter();
  const sortedAvail = available.slice().sort();
  const latest = (selected.length ? selected.slice().sort() : sortedAvail).slice(-1)[0] || "2026-05";
  const fy = (() => { const [y, m] = latest.split("-").map(Number); return m >= 4 ? y : y - 1; })();
  const fyMonths = Array.from({ length: 12 }, (_, i) => { const mo = 4 + i, y = mo <= 12 ? fy : fy + 1, mm = mo <= 12 ? mo : mo - 12; return `${y}-${String(mm).padStart(2, "0")}`; });
  const fyAvail = fyMonths.filter((m) => available.includes(m));

  const opts: { label: string; key: string }[] = [];
  if (fyAvail.length) opts.push({ label: `累计（FY${fy} 财年）`, key: fyAvail.slice().sort().join(",") });
  for (const m of sortedAvail) opts.push({ label: `${m} 单月`, key: m });

  const curKey = selected.slice().sort().join(",");
  // 当前选择若不在预设里（自定义多选），补一个显示项
  if (curKey && !opts.some((o) => o.key === curKey)) opts.unshift({ label: `自定义（${selected.length}个月）`, key: curKey });

  return (
    <select value={curKey} onChange={(e) => router.push(`${basePath}?months=${e.target.value}`)}
      style={{ padding: "7px 12px", background: "var(--panel)", border: "1px solid var(--accent)", borderRadius: 8, color: "var(--accent)", fontSize: 14, fontWeight: 600, cursor: "pointer", minWidth: 200 }}>
      {opts.map((o) => <option key={o.key} value={o.key} style={{ color: "var(--text)", fontWeight: 400 }}>{o.label}</option>)}
    </select>
  );
}
