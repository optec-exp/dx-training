'use client';

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['人工费', '业务维持费', '业务活动费', '人才IT投资'];

type Expense = {
  日期: string;
  类别: string;
  金额: number | string;
  摘要: string;
  经办人: string;
  记录时间: string;
};

function toYM(date: Date) {
  return date.toISOString().slice(0, 7);
}

function exportCSV(data: Expense[], month: string) {
  const header = ['日期', '类别', '金额', '摘要', '经办人', '记录时间'];
  const rows = data.map((r) =>
    header.map((h) => `"${String(r[h as keyof Expense] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const bom = '﻿';
  const csv = bom + [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `经费台账_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [records, setRecords] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterCat, setFilterCat] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(toYM(new Date()));
  const [toast, setToast] = useState('');

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: CATEGORIES[0],
    amount: '',
    description: '',
    person: '王莹',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const json = await res.json();
      setRecords(json.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return;
    setSubmitting(true);
    try {
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: form.date,
          category: form.category,
          amount: Number(form.amount),
          description: form.description,
          person: form.person,
        }),
      });
      setForm((f) => ({ ...f, amount: '', description: '' }));
      await fetchData();
      setToast('✅ 记录已保存到 Google Sheets');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setSubmitting(false);
    }
  }

  // 当月数据（用于统计卡片和类别汇总）
  const monthlyRecords = records.filter((r) => String(r['日期']).startsWith(selectedMonth));
  const monthlyAmounts = monthlyRecords.map((r) => Number(r['金额']) || 0);
  const stats = {
    total: monthlyAmounts.reduce((a, b) => a + b, 0),
    count: monthlyRecords.length,
    maxAmount: monthlyAmounts.length ? Math.max(...monthlyAmounts) : 0,
  };

  // 记录列表：按月份 + 类别 + 关键词筛选，按日期从早到晚排序
  const filtered = records
    .filter((r) => String(r['日期']).startsWith(selectedMonth))
    .filter((r) => filterCat === '全部' || r['类别'] === filterCat)
    .filter((r) => {
      if (!searchText.trim()) return true;
      const q = searchText.trim().toLowerCase();
      return (
        String(r['日期']).includes(q) ||
        String(r['类别']).includes(q) ||
        String(r['金额']).includes(q) ||
        String(r['摘要']).toLowerCase().includes(q) ||
        String(r['经办人']).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => String(a['日期']).localeCompare(String(b['日期'])));

  const filteredTotal = filtered.reduce((sum, r) => sum + (Number(r['金额']) || 0), 0);

  // 生成最近12个月的选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return toYM(d);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 顶栏 */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-lg font-bold">¥</div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">经费台账</h1>
            <p className="text-xs text-slate-500">Google Sheets 连接 — 在线读写数据</p>
          </div>
          {/* 月份切换 */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500">查看月份：</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">作品28</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* 统计卡片 */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{selectedMonth} 汇总</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="合计金额" value={`¥${stats.total.toLocaleString()}`} sub={`共 ${stats.count} 笔`} color="emerald" />
            <StatCard label="记录笔数" value={`${stats.count} 笔`} sub="当月已录入" color="blue" />
            <StatCard label="最大单笔" value={`¥${stats.maxAmount.toLocaleString()}`} sub="当月最高额" color="amber" />
          </div>
        </section>

        {/* 各类别汇总 */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">各类别汇总（{selectedMonth}）</h2>
          <div className="grid grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => {
              const catRecords = monthlyRecords.filter((r) => r['类别'] === cat);
              const catTotal = catRecords.reduce((sum, r) => sum + (Number(r['金额']) || 0), 0);
              const catCount = catRecords.length;
              const ratio = stats.total > 0 ? Math.round((catTotal / stats.total) * 100) : 0;
              return (
                <div key={cat} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[cat]}`}>{cat}</span>
                    <span className="text-xs text-slate-400">{catCount} 笔</span>
                  </div>
                  <p className="text-xl font-bold text-slate-800">¥{catTotal.toLocaleString()}</p>
                  <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 text-right">{ratio}%</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* 录入表单 */}
          <section className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">新增记录</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">日期</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">类别</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">金额（日元）</label>
                  <input
                    type="number"
                    placeholder="例：3500"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">摘要</label>
                  <input
                    type="text"
                    placeholder="例：东京出差 新干线"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">经办人</label>
                  <input
                    type="text"
                    value={form.person}
                    onChange={(e) => setForm({ ...form, person: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {submitting ? '保存中...' : '保存到 Google Sheets →'}
                </button>
              </form>
            </div>
          </section>

          {/* 记录列表 */}
          <section className="lg:col-span-3 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">记录列表</h2>
              <div className="flex items-center gap-2">
                <select
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option>全部</option>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <button
                  onClick={fetchData}
                  className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 hover:border-emerald-400 px-3 py-1 rounded-lg transition-colors"
                >
                  刷新
                </button>
                <button
                  onClick={() => exportCSV(filtered, selectedMonth)}
                  disabled={filtered.length === 0}
                  className="text-xs text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 px-3 py-1 rounded-lg transition-colors"
                >
                  导出 CSV
                </button>
              </div>
            </div>

            {/* 搜索框 */}
            <div className="mb-3 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="搜索日期、类别、金额、摘要、经办人..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" style={{ height: '420px' }}>
              {loading ? (
                <div className="flex items-center justify-center flex-1 text-slate-400 text-sm">
                  读取中...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-slate-400 text-sm gap-2">
                  <span className="text-3xl">📋</span>
                  {searchText ? `未找到包含「${searchText}」的记录` : '暂无记录'}
                </div>
              ) : (
                <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                  {filtered.map((r, i) => (
                    <RecordRow key={i} record={r} highlight={searchText} />
                  ))}
                </div>
              )}
              {/* 筛选后小计 */}
              {filtered.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-2.5 bg-slate-50 flex items-center justify-between shrink-0">
                  <span className="text-xs text-slate-500">
                    {filterCat !== '全部' || searchText ? `筛选结果：${filtered.length} 笔` : `共 ${filtered.length} 笔`}
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    小计：¥{filteredTotal.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2 text-right">
              显示 {filtered.length} / {records.length} 条 — 按日期从早到晚排列 — 数据来源：Google Sheets
            </p>
          </section>
        </div>
      </main>

      {/* 提示气泡 */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-600 text-white text-sm px-5 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub: string; color: 'emerald' | 'blue' | 'amber';
}) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-60 mt-1">{sub}</p>
    </div>
  );
}

const CAT_COLORS: Record<string, string> = {
  '人工费': 'bg-blue-100 text-blue-700',
  '业务维持费': 'bg-emerald-100 text-emerald-700',
  '业务活动费': 'bg-purple-100 text-purple-700',
  '人才IT投资': 'bg-amber-100 text-amber-700',
};

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function RecordRow({ record, highlight: q = '' }: { record: Expense; highlight?: string }) {
  const cat = String(record['类别'] || '其他');
  const amount = Number(record['金额']) || 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[cat] || 'bg-slate-100 text-slate-600'}`}>
            {highlight(cat, q)}
          </span>
          <span className="text-xs text-slate-400">{highlight(String(record['日期']), q)}</span>
        </div>
        <p className="text-sm text-slate-700 truncate">{highlight(String(record['摘要'] || '—'), q)}</p>
        <p className="text-xs text-slate-400">{highlight(String(record['经办人']), q)}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-bold text-slate-800">{highlight(`¥${amount.toLocaleString()}`, q)}</p>
      </div>
    </div>
  );
}
