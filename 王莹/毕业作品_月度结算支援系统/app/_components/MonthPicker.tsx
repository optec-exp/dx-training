"use client";

import { useRouter } from "next/navigation";

// 月份选择器：选任意 YYYY-MM，跳转到 basePath?month=...
export default function MonthPicker({ value, basePath }: { value: string; basePath: string }) {
  const router = useRouter();
  return (
    <input
      type="month"
      defaultValue={value}
      onChange={(e) => { if (e.target.value) router.push(`${basePath}?month=${e.target.value}`); }}
      style={{ padding: "6px 10px", background: "var(--panel-2)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }}
    />
  );
}
