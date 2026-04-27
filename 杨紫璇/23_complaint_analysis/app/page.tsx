'use client';

import { useState, useEffect, useMemo } from 'react';

interface Complaint {
  id: string;
  date: string;
  type: string;
  customer: string;
  description: string;
  status: string;
}

const TYPE_COLORS: Record<string, string> = {
  破损:   '#e05555',
  延误:   '#f0a040',
  文件错误: '#f0c040',
  温度超标: '#5b9cf6',
  其他:   '#a78bfa',
};

const ALL_TYPES = ['破损', '延误', '文件错误', '温度超标', '其他'];

export default function Home() {
  const [data, setData] = useState<Complaint[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('全部');
  const [chartMode, setChartMode] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    fetch('/data/complaints.json')
      .then((r) => r.json())
      .then((d: Complaint[]) => setData(d));
  }, []);

  const months = useMemo(() => {
    const set = new Set(data.map((c) => c.date.slice(0, 7)));
    return ['全部', ...Array.from(set).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    if (selectedMonth === '全部') return data;
    return data.filter((c) => c.date.startsWith(selectedMonth));
  }, [data, selectedMonth]);

  const total = filtered.length;

  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of ALL_TYPES) map[t] = 0;
    for (const c of filtered) map[c.type] = (map[c.type] ?? 0) + 1;
    return map;
  }, [filtered]);

  const maxCount = Math.max(...Object.values(typeCounts), 1);

  const pieGradient = useMemo(() => {
    let cursor = 0;
    const stops: string[] = [];
    for (const t of ALL_TYPES) {
      const pct = total > 0 ? (typeCounts[t] / total) * 100 : 0;
      stops.push(`${TYPE_COLORS[t]} ${cursor}% ${cursor + pct}%`);
      cursor += pct;
    }
    return `conic-gradient(${stops.join(', ')})`;
  }, [typeCounts, total]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <header style={{ background: 'var(--dark2)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · COMPLAINT ANALYSIS
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            客户投诉分类分析工具
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            投诉件数 × 类型可视化 · 数据来源：complaints.json
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px' }}>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {months.map((m) => (
              <button key={m} onClick={() => setSelectedMonth(m)} style={{
                padding: '6px 16px', borderRadius: 24,
                border: `1px solid ${selectedMonth === m ? 'var(--gold)' : 'var(--border)'}`,
                background: selectedMonth === m ? 'var(--gold)' : 'transparent',
                color: selectedMonth === m ? 'var(--dark)' : 'var(--text-dim)',
                fontFamily: 'Georgia, serif', fontSize: 13,
                fontWeight: selectedMonth === m ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {m}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 0, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
            {(['bar', 'pie'] as const).map((mode) => (
              <button key={mode} onClick={() => setChartMode(mode)} style={{
                padding: '7px 18px',
                background: chartMode === mode ? 'var(--gold)' : 'transparent',
                color: chartMode === mode ? 'var(--dark)' : 'var(--text-dim)',
                border: 'none', fontFamily: 'Georgia, serif', fontSize: 13,
                fontWeight: chartMode === mode ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {mode === 'bar' ? '柱状图' : '圆饼图'}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 24px', textAlign: 'center', minWidth: 110 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)' }}>{total}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>投诉总件数</div>
          </div>
          {ALL_TYPES.map((t) => (
            <div key={t} style={{
              background: 'var(--card)', border: `1px solid ${TYPE_COLORS[t]}44`,
              borderRadius: 10, padding: '16px 20px', textAlign: 'center', minWidth: 100,
            }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: TYPE_COLORS[t] }}>{typeCounts[t]}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{t}</div>
              <div style={{ fontSize: 11, color: TYPE_COLORS[t], marginTop: 2 }}>
                {total > 0 ? Math.round((typeCounts[t] / total) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px 32px', marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, color: 'var(--gold)', marginBottom: 24, fontFamily: 'Georgia, serif' }}>
            投诉类型分布
            <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 12 }}>
              {selectedMonth === '全部' ? '全期间' : selectedMonth} · 共 {total} 件
            </span>
          </h2>

          {chartMode === 'bar' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {ALL_TYPES.map((t) => {
                const count = typeCounts[t];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={t}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: TYPE_COLORS[t] }} />
                        <span style={{ fontSize: 14, color: 'var(--text)' }}>{t}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLORS[t] }}>{count} 件</span>
                        <span style={{ fontSize: 13, color: 'var(--text-dim)', minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(count / maxCount) * 100}%`,
                        background: TYPE_COLORS[t],
                        borderRadius: 6,
                        transition: 'width 0.5s ease',
                        minWidth: count > 0 ? 4 : 0,
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
              <div style={{
                width: 200, height: 200, borderRadius: '50%',
                background: total > 0 ? pieGradient : 'rgba(255,255,255,0.05)',
                flexShrink: 0, boxShadow: '0 0 30px rgba(0,0,0,0.4)',
              }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {ALL_TYPES.map((t) => {
                  const count = typeCounts[t];
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: TYPE_COLORS[t], flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: 'var(--text)', minWidth: 64 }}>{t}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TYPE_COLORS[t], minWidth: 40 }}>{count} 件</span>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 15, color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
              投诉明细
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 400, marginLeft: 12 }}>{filtered.length} 条记录</span>
            </h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['编号', '日期', '类型', '客户', '描述', '状态'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{c.id}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{c.date}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 12, color: TYPE_COLORS[c.type],
                        background: TYPE_COLORS[c.type] + '20',
                        border: `1px solid ${TYPE_COLORS[c.type]}55`,
                        borderRadius: 12, padding: '2px 10px',
                      }}>{c.type}</span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap' }}>{c.customer}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-dim)', maxWidth: 260 }}>{c.description}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: 12,
                        color: c.status === '已关闭' ? '#4caf50' : '#f0a040',
                        background: c.status === '已关闭' ? 'rgba(76,175,80,0.12)' : 'rgba(240,160,64,0.12)',
                        border: `1px solid ${c.status === '已关闭' ? 'rgba(76,175,80,0.4)' : 'rgba(240,160,64,0.4)'}`,
                        borderRadius: 12, padding: '2px 10px',
                      }}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 12, marginTop: 20 }}>
        OPTEC Express · Complaint Analysis Tool · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
