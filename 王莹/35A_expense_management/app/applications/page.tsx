'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase, CATEGORY_LABELS, STATUS_LABELS, ExpenseApplication } from '@/lib/supabase';
import { StatusBadge } from '@/components/StatusBadge';

export default function ApplicationsListPage() {
  const [items, setItems] = useState<ExpenseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('expense_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setItems((data ?? []) as ExpenseApplication[]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!statusFilter) return items;
    return items.filter((it) => it.status === statusFilter);
  }, [items, statusFilter]);

  const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '…' : s);

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline text-sm">← 返回首页</Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">费用申请列表</h1>
        <Link
          href="/applications/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-semibold"
        >
          + 新建申请
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold">状态筛选：</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white"
        >
          <option value="">全部</option>
          {Object.entries(STATUS_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          共 {filtered.length} 条{statusFilter && ` / 全部 ${items.length} 条`}
        </span>
      </div>

      {loading && <p className="text-gray-500">加载中…</p>}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded p-3 text-red-800 text-sm">
          加载失败：{error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-8 text-center text-gray-500">
          {statusFilter ? `没有"${STATUS_LABELS[statusFilter]}"状态的申请` : '还没有申请数据，点右上角"新建申请"开始'}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left">创建时间</th>
                <th className="border p-2 text-left">申请人</th>
                <th className="border p-2 text-left">类别</th>
                <th className="border p-2 text-right">金额 (¥)</th>
                <th className="border p-2 text-left">状态</th>
                <th className="border p-2 text-left">摘要</th>
                <th className="border p-2 text-center w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => (
                <tr key={it.id} className="hover:bg-blue-50">
                  <td className="border p-2 whitespace-nowrap text-gray-600">
                    {new Date(it.created_at).toLocaleString('zh-CN', { hour12: false })}
                  </td>
                  <td className="border p-2">{it.applicant_name}</td>
                  <td className="border p-2">{CATEGORY_LABELS[it.category] ?? it.category}</td>
                  <td className="border p-2 text-right font-mono">
                    {Number(it.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border p-2"><StatusBadge status={it.status} /></td>
                  <td className="border p-2 text-gray-700">{truncate(it.summary, 20)}</td>
                  <td className="border p-2 text-center">
                    <Link
                      href={`/applications/${it.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      查看
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
