'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase, CATEGORY_LABELS, MonthlySummaryRow } from '@/lib/supabase';

export default function MonthlySummaryPage() {
  const [rows, setRows] = useState<MonthlySummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_monthly_summary')
        .select('*');
      if (error) {
        setError(error.message);
      } else {
        // 数据库视图本身已按 month desc, category 排序
        // numeric 类型在 supabase-js 中返回 string，需转 number
        const normalized: MonthlySummaryRow[] = (data ?? []).map((r) => ({
          month: r.month,
          category: r.category,
          application_count: Number(r.application_count),
          total_amount: Number(r.total_amount),
        }));
        setRows(normalized);
      }
      setLoading(false);
    };
    load();
  }, []);

  // 可选月份列表（去重 + 保持顺序）
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.month));
    return Array.from(set);  // 视图已 desc 排序
  }, [rows]);

  // 应用月份筛选
  const filtered = useMemo(() => {
    if (!monthFilter) return rows;
    return rows.filter((r) => r.month === monthFilter);
  }, [rows, monthFilter]);

  // 按月份分组
  const grouped = useMemo(() => {
    const map = new Map<string, MonthlySummaryRow[]>();
    filtered.forEach((r) => {
      if (!map.has(r.month)) map.set(r.month, []);
      map.get(r.month)!.push(r);
    });
    return Array.from(map.entries());  // [[month, rows[]], ...]
  }, [filtered]);

  // 顶部总计
  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, r) => ({
        count: acc.count + r.application_count,
        amount: acc.amount + r.total_amount,
      }),
      { count: 0, amount: 0 }
    );
  }, [filtered]);

  const fmtAmount = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline text-sm">← 返回首页</Link>
      </div>

      <h1 className="text-2xl font-bold mb-1">月度汇总</h1>
      <p className="text-xs text-gray-500 mb-6">
        统计口径：仅"完成"状态的申请，按审批完成时间归属月份
      </p>

      <section className="border border-gray-200 rounded p-4 mb-6 bg-gray-50 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold">月份筛选：</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
          >
            <option value="">全部</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-gray-700">
          共 <span className="font-bold">{totals.count}</span> 笔已通过 ·
          总金额 <span className="font-bold font-mono">¥ {fmtAmount(totals.amount)}</span>
        </div>
      </section>

      {loading && <p className="text-gray-500">加载中…</p>}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-sm">
          加载失败：{error}
        </div>
      )}

      {!loading && !error && grouped.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
          {monthFilter
            ? `${monthFilter} 暂无已通过的申请`
            : '还没有已通过的申请数据。先在"申请列表"里完成几条审批流程吧。'}
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([month, monthRows]) => {
          const monthTotal = monthRows.reduce(
            (acc, r) => ({
              count: acc.count + r.application_count,
              amount: acc.amount + r.total_amount,
            }),
            { count: 0, amount: 0 }
          );
          return (
            <section key={month} className="border border-gray-200 rounded overflow-hidden">
              <header className="bg-blue-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-blue-800">{month}</h2>
                <span className="text-sm text-gray-600">
                  {monthRows.length} 类
                </span>
              </header>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 border-b">类别</th>
                    <th className="text-right px-4 py-2 border-b w-24">件数</th>
                    <th className="text-right px-4 py-2 border-b w-40">金额 (¥)</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((r) => (
                    <tr key={r.category} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">
                        {CATEGORY_LABELS[r.category] ?? r.category}
                      </td>
                      <td className="text-right px-4 py-2 border-b font-mono">{r.application_count}</td>
                      <td className="text-right px-4 py-2 border-b font-mono">{fmtAmount(r.total_amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-yellow-50 font-bold">
                    <td className="px-4 py-2 text-right">月合计</td>
                    <td className="text-right px-4 py-2 font-mono">{monthTotal.count}</td>
                    <td className="text-right px-4 py-2 font-mono">{fmtAmount(monthTotal.amount)}</td>
                  </tr>
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </main>
  );
}
