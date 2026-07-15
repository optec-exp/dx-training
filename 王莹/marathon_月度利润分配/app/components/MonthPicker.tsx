"use client";

import { useLang } from "./LanguageProvider";

interface Props {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
  disabled?: boolean;
}

function buildMonths(yearLabel: string, monthLabel: string): { year: number; month: number; label: string }[] {
  const result: { year: number; month: number; label: string }[] = [];
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;

  let y = 2026;
  let m = 4;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    result.push({ year: y, month: m, label: `${y}${yearLabel}${m}${monthLabel}` });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return result.reverse();
}

export function MonthPicker({ year, month, onChange, disabled }: Props) {
  const { t } = useLang();
  const months = buildMonths(t("labelYear"), t("labelMonth"));
  const current = `${year}-${month}`;

  return (
    <select
      value={current}
      disabled={disabled}
      onChange={(e) => {
        const [y, m] = e.target.value.split("-").map(Number);
        onChange(y, m);
      }}
      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-medium shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
    >
      {months.map((m) => (
        <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
