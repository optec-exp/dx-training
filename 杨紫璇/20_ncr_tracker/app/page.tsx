'use client';

import { useState, useMemo } from 'react';
import { ACTIONS, type Action } from '@/data/actions';

type Status = '逾期' | '临近期限' | '进行中' | '完成';

const STATUS_ORDER: Status[] = ['逾期', '临近期限', '进行中', '完成'];

const STATUS_STYLE: Record<Status, { color: string; bg: string; border: string }> = {
  逾期:   { color: '#e05555', bg: 'rgba(224,85,85,0.12)',   border: 'rgba(224,85,85,0.4)' },
  临近期限: { color: '#f0c040', bg: 'rgba(240,192,64,0.12)', border: 'rgba(240,192,64,0.4)' },
  进行中: { color: '#4caf50', bg: 'rgba(76,175,80,0.12)',   border: 'rgba(76,175,80,0.4)' },
  完成:   { color: '#888',    bg: 'rgba(136,136,136,0.10)', border: 'rgba(136,136,136,0.3)' },
};

function getStatus(action: Action, today: Date): Status {
  if (action.completed) return '完成';
  const due = new Date(action.dueDate);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '逾期';
  if (diff <= 7) return '临近期限';
  return '进行中';
}

function getDaysText(action: Action, today: Date): string {
  if (action.completed) return '已完成';
  const due = new Date(action.dueDate);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `逾期 ${Math.abs(diff)} 天`;
  if (diff === 0) return '今日截止';
  return `剩余 ${diff} 天`;
}

export default function Home() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(ACTIONS.filter((a) => a.completed).map((a) => a.id))
  );
  const [filterStatus, setFilterStatus] = useState<Status | '全部'>('全部');
  const [filterDept, setFilterDept] = useState<string>('全部');

  const allDepts = useMemo(() => {
    const depts = Array.from(new Set(ACTIONS.map((a) => a.department)));
    return ['全部', ...depts];
  }, []);

  function toggleComplete(id: number) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const enriched = useMemo(() => {
    return ACTIONS.map((a) => {
      const action = { ...a, completed: completed.has(a.id) };
      return { action, status: getStatus(action, today), daysText: getDaysText(action, today) };
    });
  }, [completed, today]);

  const sorted = useMemo(() => {
    return [...enriched]
      .filter((e) => filterStatus === '全部' || e.status === filterStatus)
      .filter((e) => filterDept === '全部' || e.action.department === filterDept)
      .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
  }, [enriched, filterStatus]);

  const deptEnriched = useMemo(() => {
    return filterDept === '全部' ? enriched : enriched.filter((e) => e.action.department === filterDept);
  }, [enriched, filterDept]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 全部: deptEnriched.length };
    for (const s of STATUS_ORDER) c[s] = deptEnriched.filter((e) => e.status === s).length;
    return c;
  }, [deptEnriched]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--dark2)',
        borderBottom: '1px solid var(--border)',
        padding: '24px 32px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · NCR MANAGEMENT
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            纠正措施期限追踪器
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            Corrective Action Deadline Tracker · 实时剩余天数与状态显示
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
        {/* Dept Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {allDepts.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              style={{
                padding: '6px 16px',
                borderRadius: 24,
                border: '1px solid',
                borderColor: filterDept === dept ? 'var(--gold)' : 'var(--border)',
                background: filterDept === dept ? 'var(--gold)' : 'transparent',
                color: filterDept === dept ? 'var(--dark)' : 'var(--text-dim)',
                fontFamily: 'Georgia, serif',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: filterDept === dept ? 700 : 400,
                transition: 'all 0.2s',
              }}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {(['全部', ...STATUS_ORDER] as const).map((s) => {
            const style = s === '全部'
              ? { color: 'var(--gold)', bg: 'rgba(201,169,110,0.1)', border: 'var(--border)' }
              : STATUS_STYLE[s];
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1px solid ${active ? style.border : 'var(--border)'}`,
                  background: active ? style.bg : 'var(--card)',
                  color: active ? style.color : 'var(--text-dim)',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 700, color: style.color }}>{counts[s]}</span>
                <span>{s}</span>
              </button>
            );
          })}
        </div>

        {/* Action List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sorted.map(({ action, status, daysText }) => {
            const st = STATUS_STYLE[status];
            return (
              <div
                key={action.id}
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${st.border}`,
                  borderRadius: 12,
                  padding: '20px 24px',
                  opacity: status === '完成' ? 0.65 : 1,
                  transition: 'opacity 0.3s, border-color 0.3s',
                }}
              >
                {/* Top Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* NCR No */}
                    <span style={{
                      fontSize: 11,
                      color: 'var(--gold)',
                      background: 'rgba(201,169,110,0.12)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      padding: '2px 10px',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}>
                      {action.ncrNo}
                    </span>
                    {/* Dept */}
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{action.department}</span>
                    {/* Owner */}
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>· {action.owner}</span>
                  </div>

                  {/* Right: status + days + complete btn */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    {/* Status Badge */}
                    <span style={{
                      fontSize: 12,
                      color: st.color,
                      background: st.bg,
                      border: `1px solid ${st.border}`,
                      borderRadius: 20,
                      padding: '3px 12px',
                      fontWeight: 600,
                    }}>
                      {status}
                    </span>
                    {/* Days */}
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: st.color,
                      minWidth: 80,
                      textAlign: 'right',
                    }}>
                      {daysText}
                    </span>
                    {/* Complete Button */}
                    <button
                      onClick={() => toggleComplete(action.id)}
                      style={{
                        padding: '5px 14px',
                        borderRadius: 8,
                        border: `1px solid ${status === '完成' ? 'rgba(136,136,136,0.4)' : 'rgba(76,175,80,0.5)'}`,
                        background: status === '完成' ? 'rgba(136,136,136,0.1)' : 'rgba(76,175,80,0.12)',
                        color: status === '完成' ? 'var(--gray)' : '#4caf50',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontFamily: 'Georgia, serif',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      {status === '完成' ? '↩ 撤销' : '✓ 完成'}
                    </button>
                  </div>
                </div>

                {/* Issue */}
                <p style={{
                  fontSize: 14,
                  color: status === '完成' ? 'var(--text-dim)' : 'var(--text)',
                  lineHeight: 1.6,
                  marginBottom: 8,
                  textDecoration: status === '完成' ? 'line-through' : 'none',
                }}>
                  {action.issue}
                </p>

                {/* Measure */}
                <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                  纠正措施：{action.measure}
                </p>

                {/* Due Date */}
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  截止日期：<span style={{ color: st.color }}>{action.dueDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-dim)',
        fontSize: 12,
        marginTop: 20,
      }}>
        OPTEC Express · NCR Corrective Action Tracker · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
