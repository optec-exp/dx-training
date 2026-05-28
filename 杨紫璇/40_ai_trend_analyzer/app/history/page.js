'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';

export default function HistoryPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selected, setSelected] = useState([]); // 选中的报告id(最多2个)

  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState('');
  const [compareError, setCompareError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('analysis_reports')
        .select('*')
        .order('created_at', { ascending: false });
      setReports(data || []);
      setLoading(false);
    }
    load();
  }, []);

  function toggleSelect(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // 超过2个，替换最早选的
      return [...prev, id];
    });
  }

  async function runCompare() {
    const [a, b] = selected.map((id) => reports.find((r) => r.id === id));
    setComparing(true);
    setCompareError(null);
    setCompareResult('');
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportA: a, reportB: b }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '对比失败');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setCompareResult(acc);
      }
    } catch (e) {
      setCompareError(e.message);
    }
    setComparing(false);
  }

  if (loading) return <p className="p-8 text-gray-500">加载中…</p>;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">历史报告</h1>
          <p className="text-gray-500">共 {reports.length} 份 · 按时间倒序</p>
        </div>
        <Link href="/" className="text-blue-600 hover:underline">← 返回看板</Link>
      </header>

      {/* 对比操作条 */}
      <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3 text-sm">
        <span className="text-gray-600">已选 {selected.length}/2 份</span>
        <button
          onClick={runCompare}
          disabled={selected.length !== 2 || comparing}
          className="rounded bg-blue-600 px-4 py-1.5 font-semibold text-white disabled:opacity-40"
        >
          {comparing ? 'AI 对比中…' : 'AI 对比这两份'}
        </button>
        <span className="text-gray-400">勾选两份报告后，让 AI 判断问题有没有改善</span>
      </div>

      {/* 对比结果 */}
      {(comparing || compareResult || compareError) && (
        <section className="rounded-lg border bg-white p-5 shadow-sm" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <h2 className="mb-2 text-lg font-semibold">🔀 AI 对比解读</h2>
          {compareError && <p className="text-red-600">出错：{compareError}</p>}
          {comparing && !compareResult && <p className="text-gray-500">AI 正在对比两份报告…</p>}
          {compareResult && <div className="md-body"><ReactMarkdown>{compareResult}</ReactMarkdown></div>}
        </section>
      )}

      {reports.length === 0 && (
        <p className="text-gray-400">还没有保存过报告。去看板生成分析后点「保存报告」。</p>
      )}

      {/* 报告列表 */}
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggleSelect(r.id)}
                />
                <span className="font-semibold">{r.title}</span>
              </label>
              <div className="flex items-center gap-3 whitespace-nowrap text-sm text-gray-500">
                <span>{new Date(r.created_at).toLocaleString('zh-CN')}</span>
                <button
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  className="text-blue-600 hover:underline"
                >
                  {expandedId === r.id ? '收起' : '查看全文'}
                </button>
              </div>
            </div>
            {expandedId === r.id && (
              <div className="mt-3 border-t pt-3">
                <div className="md-body"><ReactMarkdown>{r.report_content}</ReactMarkdown></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
