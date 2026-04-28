'use client';
import { useState, useMemo } from 'react';
import { FAQS } from '@/data/faqs';

const DEPTS = ['全部', 'OS部門', 'GC部門', '総務', '人事', '品宣', '財務', 'DX室'];

const DEPT_COLOR: Record<string, string> = {
  'OS部門': '#0ea5e9', 'GC部門': '#06b6d4', '総務': '#a78bfa',
  '人事': '#c084fc', '品宣': '#e879f9', '財務': '#f472b6', 'DX室': '#fb923c',
};

function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#f59e0b44', color: '#fbbf24', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function Page() {
  const [dept, setDept] = useState('全部');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(null);

  const q = query.trim().toLowerCase();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of DEPTS.slice(1)) {
      map[d] = FAQS.filter(f => f.dept === d && (
        !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      )).length;
    }
    map['全部'] = FAQS.filter(f => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)).length;
    return map;
  }, [q]);

  const filtered = useMemo(() => {
    return FAQS.filter(f => {
      const matchDept = dept === '全部' || f.dept === dept;
      if (!q) return matchDept;
      return matchDept && (f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    });
  }, [dept, q]);

  const hotList = useMemo(() => filtered.filter(f => f.hot), [filtered]);
  const normalList = useMemo(() => filtered.filter(f => !f.hot), [filtered]);

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '20px 32px 0', borderBottom: '1px solid #0d1829' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>OPTEC 社内FAQ</div>
            <div style={{ fontSize: 12, color: '#334155', marginTop: 3 }}>
              {FAQS.length} 条 · 7 部门 · 关键词搜索
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setOpenId(null); }}
              placeholder="搜索问题 / 答案..."
              style={{
                width: 260, padding: '9px 14px', borderRadius: 8,
                border: '1px solid #1e3a5f', background: '#07111d',
                color: '#e2e8f0', fontSize: 13, outline: 'none',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setOpenId(null); }}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
              >×</button>
            )}
            {q && (
              <span style={{ fontSize: 12, color: counts['全部'] > 0 ? '#f59e0b' : '#ef4444', whiteSpace: 'nowrap' }}>
                {counts['全部'] > 0 ? `找到 ${counts['全部']} 条` : '未找到'}
              </span>
            )}
          </div>
        </div>

        {/* Dept tabs */}
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', paddingBottom: 0 }}>
          {DEPTS.map(d => {
            const active = dept === d;
            const c = d === '全部' ? '#64748b' : DEPT_COLOR[d];
            const cnt = counts[d] ?? 0;
            return (
              <button
                key={d}
                onClick={() => { setDept(d); setOpenId(null); }}
                style={{
                  padding: '8px 14px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  background: active ? c + '22' : 'transparent',
                  color: active ? c : '#475569',
                  borderBottom: active ? `2px solid ${c}` : '2px solid transparent',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {d}
                {q ? (
                  <span style={{ marginLeft: 5, fontSize: 11, opacity: 0.8 }}>({cnt})</span>
                ) : (
                  d !== '全部' && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.5 }}>
                    {FAQS.filter(f => f.dept === d).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ list */}
      <div style={{ padding: '24px 32px', maxWidth: 860 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#334155', padding: '60px 0', fontSize: 14 }}>
            没有找到匹配的问题，请尝试其他关键词
          </div>
        ) : (
          <>
            {/* Hot section */}
            {hotList.length > 0 && !q && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, color: '#f59e0b', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                  常见问题
                </div>
                {hotList.map(f => <FaqItem key={f.id} faq={f} openId={openId} setOpenId={setOpenId} q={q} />)}
              </div>
            )}

            {/* Normal or all (when searching) */}
            {(q ? filtered : normalList).map(f => (
              <FaqItem key={f.id} faq={f} openId={openId} setOpenId={setOpenId} q={q} />
            ))}
          </>
        )}
      </div>

      {/* Footer count */}
      <div style={{ padding: '0 32px 32px', fontSize: 11, color: '#1e3a5f' }}>
        显示 {filtered.length} / {FAQS.length} 条
      </div>
    </div>
  );
}

function FaqItem({
  faq: f, openId, setOpenId, q,
}: {
  faq: (typeof FAQS)[number];
  openId: number | null;
  setOpenId: (id: number | null) => void;
  q: string;
}) {
  const isOpen = openId === f.id;
  const c = DEPT_COLOR[f.dept] ?? '#64748b';
  return (
    <div style={{
      marginBottom: 6, borderRadius: 8,
      border: `1px solid ${isOpen ? c + '55' : '#0d1829'}`,
      background: isOpen ? c + '0a' : '#06101e',
      overflow: 'hidden', transition: 'all 0.15s',
    }}>
      <button
        onClick={() => setOpenId(isOpen ? null : f.id)}
        style={{
          width: '100%', padding: '13px 16px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
        }}
      >
        <div style={{ width: 3, height: 16, borderRadius: 2, background: c, flexShrink: 0 }} />
        <div style={{ flex: 1, fontSize: 14, color: isOpen ? '#f1f5f9' : '#cbd5e1', lineHeight: 1.4 }}>
          {highlight(f.q, q)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {f.hot && !q && (
            <span style={{ fontSize: 10, color: '#f59e0b', background: '#f59e0b18', padding: '2px 6px', borderRadius: 4 }}>
              常见
            </span>
          )}
          <span style={{ fontSize: 10, color: c, background: c + '18', padding: '2px 7px', borderRadius: 4 }}>
            {f.dept}
          </span>
          <span style={{ color: '#334155', fontSize: 14, transition: 'transform 0.15s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 14px 29px', fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>
          {highlight(f.a, q)}
        </div>
      )}
    </div>
  );
}
