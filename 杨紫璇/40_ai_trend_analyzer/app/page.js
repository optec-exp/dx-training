'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import { aggregate } from '@/lib/aggregate';

const COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#64748b'];

// 把 AI 报告按 "## 一/二/三" 拆成三个板块
function splitReport(text) {
  const markers = [
    { key: 'trend', re: /##\s*一[^\n]*/ },
    { key: 'cause', re: /##\s*二[^\n]*/ },
    { key: 'advice', re: /##\s*三[^\n]*/ },
  ];
  const idx = markers.map((m) => {
    const mm = text.match(m.re);
    return mm ? mm.index : -1;
  });
  const out = { trend: '', cause: '', advice: '' };
  for (let i = 0; i < 3; i++) {
    if (idx[i] === -1) continue;
    const headLen = text.slice(idx[i]).match(markers[i].re)[0].length;
    const start = idx[i] + headLen;
    const end = i < 2 && idx[i + 1] !== -1 ? idx[i + 1] : text.length;
    out[markers[i].key] = text.slice(start, end).trim();
  }
  return out;
}

export default function Home() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState('');
  const [analyzeError, setAnalyzeError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('ncr_records')
        .select('*')
        .order('occur_date', { ascending: true });
      if (error) setError(error.message);
      else setRecords(data);
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => aggregate(records), [records]);
  const sec = useMemo(() => splitReport(report), [report]);
  const parsed = sec.trend || sec.cause || sec.advice;

  async function runAnalysis() {
    setAnalyzing(true);
    setAnalyzeError(null);
    setReport('');
    setSaveMsg('');
    try {
      const res = await fetch('/api/analyze', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '分析失败');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setReport(acc);
      }
    } catch (e) {
      setAnalyzeError(e.message);
    }
    setAnalyzing(false);
  }

  async function saveReport() {
    setSaving(true);
    setSaveMsg('');
    const title = `NCR 品质分析报告（${stats.total} 条 · ${new Date().toLocaleDateString('zh-CN')}）`;
    const { error } = await supabase.from('analysis_reports').insert({
      title,
      ai_provider: 'groq',
      report_content: report,
      data_snapshot: stats,
    });
    setSaving(false);
    setSaveMsg(error ? '保存失败：' + error.message : '✓ 已保存到历史报告');
  }

  if (loading) return <p className="p-8 text-gray-500">数据加载中…</p>;
  if (error) return <p className="p-8 text-red-600">读取出错：{error}</p>;

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 品质趋势分析 · NCR 看板</h1>
          <p className="text-gray-500">货代异常记录的统计、可视化与 AI 解读</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/history" className="text-blue-600 hover:underline">历史报告 →</Link>
          {saveMsg && (
            <span className={saveMsg.startsWith('✓') ? 'text-sm text-green-600' : 'text-sm text-red-600'}>
              {saveMsg}
            </span>
          )}
          {report && !analyzing && (
            <button
              onClick={saveReport}
              disabled={saving}
              className="rounded-lg border border-blue-600 px-5 py-2.5 font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              {saving ? '保存中…' : '保存报告'}
            </button>
          )}
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'AI 分析中…' : '开始 AI 分析'}
          </button>
        </div>
      </header>

      {/* 汇总卡片 */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="异常总数" value={`${stats.total} 条`} />
        <Card label="经济损失合计" value={`￥${stats.totalLoss.toLocaleString()}`} />
        <Card label="异常类型数" value={`${stats.byType.length} 种`} />
        <Card label="涉及航线" value={`${stats.byLine.length} 条`} />
      </section>

      {/* 左图表 + 右 AI 解读 并排 */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左：图表 */}
        <div className="space-y-6">
          <ChartBox title="异常类型分布（饼图）">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.byType} dataKey="value" nameKey="name" outerRadius={90} label>
                  {stats.byType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="各航线异常数（柱状图）">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byLine}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" name="异常数" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="责任方分布（柱状图）">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byParty}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" name="异常数" />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="月度异常趋势（折线图）">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.byMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#dc2626" name="异常数" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        {/* 右：AI 解读三板块 */}
        <div className="space-y-6">
          {analyzeError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
              分析出错：{analyzeError}
            </div>
          )}

          {!report && !analyzing && !analyzeError && (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-gray-400">
              点击右上角「开始 AI 分析」生成解读
            </div>
          )}

          {analyzing && !report && (
            <div className="rounded-lg border bg-white p-4 text-gray-500 shadow-sm">
              AI 正在分析数据，请稍候…
            </div>
          )}

          {report && !parsed && (
            <Panel title="AI 解读" accent="#2563eb">
              <div className="md-body"><ReactMarkdown>{report}</ReactMarkdown></div>
            </Panel>
          )}

          {report && parsed && (
            <>
              <Panel title="📈 趋势分析" accent="#2563eb">
                <div className="md-body"><ReactMarkdown>{sec.trend}</ReactMarkdown></div>
              </Panel>
              <Panel title="🔍 根本原因推断" accent="#f59e0b">
                <div className="md-body"><ReactMarkdown>{sec.cause}</ReactMarkdown></div>
              </Panel>
              <Panel title="🛠 改进建议（纠正 / 预防）" accent="#10b981">
                <div className="md-body"><ReactMarkdown>{sec.advice}</ReactMarkdown></div>
              </Panel>
            </>
          )}
        </div>
      </section>

      {/* 原始数据表格 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">原始数据（{stats.total} 条）</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-3 py-2">NCR编号</th>
                <th className="px-3 py-2">日期</th>
                <th className="px-3 py-2">异常类型</th>
                <th className="px-3 py-2">航线</th>
                <th className="px-3 py-2">责任方</th>
                <th className="px-3 py-2">客户</th>
                <th className="px-3 py-2">描述</th>
                <th className="px-3 py-2 text-right">损失(￥)</th>
                <th className="px-3 py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">{r.ncr_no}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.occur_date}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.abnormal_type}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.shipping_line}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.responsible_party}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.customer}</td>
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2 text-right">{Number(r.economic_loss).toLocaleString()}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function ChartBox({ title, children }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Panel({ title, accent, children }) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm" style={{ borderLeft: `4px solid ${accent}` }}>
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}
