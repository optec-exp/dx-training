'use client';

import { useState, useEffect, useMemo } from 'react';

interface SopItem {
  id: number;
  name: string;
  category: string;
  version: string;
  effectiveDate: string;
  nextReviewDate: string;
  owner: string;
}

type AlertLevel = 'overdue' | 'warning' | 'normal';

const ALERT_STYLE: Record<AlertLevel, { color: string; bg: string; border: string; label: string }> = {
  overdue: { color: '#e05555', bg: 'rgba(224,85,85,0.12)',  border: 'rgba(224,85,85,0.4)',  label: '已过期' },
  warning: { color: '#f0c040', bg: 'rgba(240,192,64,0.12)', border: 'rgba(240,192,64,0.4)', label: '临近审查' },
  normal:  { color: '#4caf50', bg: 'rgba(76,175,80,0.12)',  border: 'rgba(76,175,80,0.35)', label: '有效' },
};

function getAlert(nextReviewDate: string, today: Date): AlertLevel {
  const due = new Date(nextReviewDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 90) return 'warning';
  return 'normal';
}

function getDaysText(nextReviewDate: string, today: Date): string {
  const due = new Date(nextReviewDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `逾期 ${Math.abs(diffDays)} 天`;
  if (diffDays === 0) return '今日到期';
  return `还有 ${diffDays} 天`;
}

const CATEGORIES = ['全部', '温度管理', '危险品', '通关', '包装'];

export default function Home() {
  const [data, setData] = useState<SopItem[]>([]);
  const [category, setCategory] = useState('全部');

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    fetch('/data/sop.json')
      .then((r) => r.json())
      .then((d: SopItem[]) => setData(d));
  }, []);

  const enriched = useMemo(() =>
    data.map((s) => ({
      ...s,
      alert: getAlert(s.nextReviewDate, today),
      daysText: getDaysText(s.nextReviewDate, today),
    })), [data, today]);

  const filtered = useMemo(() =>
    category === '全部' ? enriched : enriched.filter((s) => s.category === category),
    [enriched, category]);

  // sort: overdue first, then warning, then normal
  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      const order = { overdue: 0, warning: 1, normal: 2 };
      return order[a.alert] - order[b.alert];
    }), [filtered]);

  const counts = useMemo(() => ({
    overdue: enriched.filter((s) => s.alert === 'overdue').length,
    warning: enriched.filter((s) => s.alert === 'warning').length,
    normal:  enriched.filter((s) => s.alert === 'normal').length,
  }), [enriched]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{ background: 'var(--dark2)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · DOCUMENT CONTROL
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            SOP 文件版本管理清单
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            作业规程的版本与有效期追踪 · 数据来源：sop.json
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '32px 24px' }}>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {([
            { key: 'overdue', label: '已过期',  count: counts.overdue },
            { key: 'warning', label: '临近审查（≤90天）', count: counts.warning },
            { key: 'normal',  label: '有效',    count: counts.normal },
          ] as const).map(({ key, label, count }) => {
            const st = ALERT_STYLE[key];
            return (
              <div key={key} style={{
                background: 'var(--card)', border: `1px solid ${st.border}`,
                borderRadius: 10, padding: '14px 22px', minWidth: 140,
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: st.color }}>{count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
              </div>
            );
          })}
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '14px 22px', minWidth: 120,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)' }}>{enriched.length}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>文件总数</div>
          </div>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '6px 18px', borderRadius: 24,
              border: `1px solid ${category === c ? 'var(--gold)' : 'var(--border)'}`,
              background: category === c ? 'var(--gold)' : 'transparent',
              color: category === c ? 'var(--dark)' : 'var(--text-dim)',
              fontFamily: 'Georgia, serif', fontSize: 13,
              fontWeight: category === c ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {c}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                  {['文件名称', '分类', '版本', '生效日期', '下次审查日期', '剩余天数', '负责部门', '状态'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: 12, color: 'var(--text-dim)',
                      fontWeight: 600, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((s, i) => {
                  const st = ALERT_STYLE[s.alert];
                  return (
                    <tr key={s.id} style={{
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                      background: s.alert === 'overdue'
                        ? 'rgba(224,85,85,0.04)'
                        : s.alert === 'warning'
                        ? 'rgba(240,192,64,0.04)'
                        : 'transparent',
                    }}>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11, color: 'var(--gold)',
                          background: 'rgba(201,169,110,0.12)',
                          border: '1px solid var(--border)',
                          borderRadius: 12, padding: '2px 10px',
                        }}>{s.category}</span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--gold)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                        {s.version}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {s.effectiveDate}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: st.color, whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {s.nextReviewDate}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: st.color, whiteSpace: 'nowrap', fontWeight: 700 }}>
                        {s.daysText}
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {s.owner}
                      </td>
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 11, color: st.color,
                          background: st.bg, border: `1px solid ${st.border}`,
                          borderRadius: 12, padding: '3px 12px', fontWeight: 600,
                        }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 12, marginTop: 20 }}>
        OPTEC Express · SOP Document Version Control · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
