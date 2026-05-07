'use client';

import { useEffect, useState, useMemo } from 'react';

type Staff = { code: string; name: string };

type Case = {
  $id: { value: string };
  見積番号: { value: string };
  顧客名書出: { value: string };
  見積ステータス: { value: string | null };
  積込港: { value: string };
  仕向地: { value: string };
  見積日: { value: string | null };
  本件見積額: { value: string };
  社内担当者: { value: Staff[] };
  作成日時: { value: string };
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  '見積作成中': { label: '見積作成中', color: '#b45309', bg: '#fef3c7' },
  '見積送付済': { label: '見積送付済', color: '#1d4ed8', bg: '#dbeafe' },
  '受注':      { label: '受注',      color: '#15803d', bg: '#dcfce7' },
  '失注':      { label: '失注',      color: '#6b7280', bg: '#f3f4f6' },
};

const ALL_STATUSES = ['見積作成中', '見積送付済', '受注', '失注'];

function formatDate(val: string | null) {
  if (!val) return '—';
  return val.replace(/-/g, '/');
}

function formatAmount(val: string) {
  if (!val || val === '0') return '—';
  const num = parseFloat(val);
  if (isNaN(num)) return '—';
  return '¥' + Math.round(num).toLocaleString();
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: '#9ca3af' }}>—</span>;
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#374151', bg: '#e5e7eb' };
  return (
    <span style={{
      background: cfg.bg,
      color: cfg.color,
      padding: '2px 10px',
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

export default function Page() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetch('/api/cases')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setCases(data);
        else setError(JSON.stringify(data));
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return cases.filter(c => {
      const statusMatch = activeStatus === 'all' || c.見積ステータス?.value === activeStatus;
      if (!statusMatch) return false;
      if (!keyword.trim()) return true;
      const kw = keyword.toLowerCase();
      return (
        c.見積番号.value.toLowerCase().includes(kw) ||
        c.顧客名書出.value.toLowerCase().includes(kw) ||
        c.積込港.value.toLowerCase().includes(kw) ||
        c.仕向地.value.toLowerCase().includes(kw) ||
        c.社内担当者.value.some(s => s.name.toLowerCase().includes(kw))
      );
    });
  }, [cases, activeStatus, keyword]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: cases.length };
    ALL_STATUSES.forEach(s => {
      map[s] = cases.filter(c => c.見積ステータス?.value === s).length;
    });
    return map;
  }, [cases]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 28, background: '#b8933a', borderRadius: 4 }} />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e', letterSpacing: 1 }}>
            見積案件一覧
          </span>
          <span style={{
            fontSize: 12, color: '#6b7280', background: '#f3f4f6',
            padding: '2px 8px', borderRadius: 4,
          }}>
            Kintone App #1000
          </span>
        </div>
        {!loading && (
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {filtered.length} 件表示 / 全 {cases.length} 件
          </span>
        )}
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 32px' }}>
        {/* Filter Bar */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 60,
          zIndex: 9,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['all', ...ALL_STATUSES] as const).map(s => {
              const isActive = activeStatus === s;
              const cfg = s === 'all' ? null : STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => setActiveStatus(s)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: isActive
                      ? `2px solid ${cfg?.color ?? '#1a1a2e'}`
                      : '2px solid transparent',
                    background: isActive ? (cfg?.bg ?? '#1a1a2e') : '#f3f4f6',
                    color: isActive ? (cfg?.color ?? '#fff') : '#374151',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s === 'all' ? '全部' : s}
                  <span style={{
                    marginLeft: 6,
                    background: 'rgba(0,0,0,0.08)',
                    borderRadius: 999,
                    fontSize: 11,
                    padding: '0 6px',
                  }}>
                    {counts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ width: 1, height: 28, background: '#e5e7eb', margin: '0 4px' }} />

          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', fontSize: 15, pointerEvents: 'none',
            }}>🔍</span>
            <input
              type="text"
              placeholder="案件番号 / 顧客名 / 仕向地 / 担当者..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 36px 7px 36px',
                borderRadius: 8,
                border: '1.5px solid #e5e7eb',
                fontSize: 13,
                outline: 'none',
                background: '#f9fafb',
                color: '#1a1a2e',
                boxSizing: 'border-box',
              }}
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#9ca3af', fontSize: 16, lineHeight: 1,
                }}
              >×</button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
              Kintone からデータを読み込み中...
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#ef4444' }}>
              エラー: {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              該当する案件がありません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fb', borderBottom: '2px solid #e5e7eb' }}>
                  {['見積番号', '顧客名', 'ステータス', '路線', '見積日', '見積額', '担当者'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: 12,
                      letterSpacing: 0.5,
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      top: 132,
                      background: '#f8f9fb',
                      zIndex: 8,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr
                    key={c.$id.value}
                    style={{
                      borderBottom: '1px solid #f3f4f6',
                      background: i % 2 === 0 ? '#fff' : '#fafafa',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa')}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1d4ed8', whiteSpace: 'nowrap' }}>
                      {c.見積番号.value || `#${c.$id.value}`}
                    </td>
                    <td style={{ padding: '12px 16px', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span title={c.顧客名書出.value}>{c.顧客名書出.value || '—'}</span>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <StatusBadge status={c.見積ステータス?.value ?? null} />
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#374151' }}>
                      {c.積込港.value && c.仕向地.value
                        ? <>{c.積込港.value} <span style={{ color: '#b8933a', fontWeight: 700 }}>→</span> {c.仕向地.value}</>
                        : c.積込港.value || c.仕向地.value || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', color: '#6b7280' }}>
                      {formatDate(c.見積日.value)}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 500, color: '#1a1a2e' }}>
                      {formatAmount(c.本件見積額.value)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>
                      {c.社内担当者.value.length > 0
                        ? c.社内担当者.value.map(s => s.name.split(' ')[0]).join(', ')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
