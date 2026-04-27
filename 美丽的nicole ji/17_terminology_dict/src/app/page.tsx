'use client';

import { useState, useEffect, useMemo } from 'react';
import { terms, CATEGORIES, type Category } from '@/data/terms';

const CATEGORY_COLOR: Record<string, string> = {
  '单证类':  '#3b82f6',
  '重量计费': '#10b981',
  '时间航班': '#f59e0b',
  '贸易术语': '#8b5cf6',
};

export default function TermDictionary() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'全部' | Category>('全部');

  // useMemo: query / activeCategory が変わるたびに即座に再計算
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter((t) => {
      const matchCat = activeCategory === '全部' || t.category === activeCategory;
      const matchQ =
        q === '' ||
        t.abbr.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q) ||
        t.zh.includes(q) ||
        (t.note?.toLowerCase().includes(q) ?? false);
      return matchCat && matchQ;
    });
  }, [query, activeCategory]);

  // useEffect: 検索結果件数をページタイトルに反映する
  useEffect(() => {
    document.title =
      filtered.length === terms.length
        ? 'OPTEC 物流术语词典'
        : `OPTEC 词典 — 找到 ${filtered.length} 条`;
  }, [filtered.length]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', color: 'var(--text)' }}>

      {/* ── Header ── */}
      <header style={{
        background: 'var(--dark-2)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '32px 24px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, letterSpacing: 4, color: 'var(--sky)', marginBottom: 8, textTransform: 'uppercase' }}>
          OPTEC Express
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          物流术语词典
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
          航空货运专业术语 · 中英对照 · 共 {terms.length} 条
        </p>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── Search Box ── */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: 'var(--muted)', pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="搜索术语…（英文缩写 / 全称 / 中文均可）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              background: 'var(--dark-3)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: 'var(--text)',
              fontSize: 15,
              outline: 'none',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18,
              }}
            >✕</button>
          )}
        </div>

        {/* ── Category Tabs ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {(['全部', ...CATEGORIES] as Array<'全部' | Category>).map((cat) => {
            const isActive = activeCategory === cat;
            const color = cat === '全部' ? '#64748b' : CATEGORY_COLOR[cat];
            const count = cat === '全部' ? terms.length : terms.filter(t => t.category === cat).length;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 20,
                  border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.15)'}`,
                  background: isActive ? color : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 0 12px ${color}66` : 'none',
                }}
              >
                {cat}
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Result Count ── */}
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          {activeCategory !== '全部' && (
            <span style={{
              display: 'inline-block', marginRight: 8,
              background: CATEGORY_COLOR[activeCategory] + '33',
              color: CATEGORY_COLOR[activeCategory],
              padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600,
            }}>
              {activeCategory}
            </span>
          )}
          显示 <strong style={{ color: 'var(--text)' }}>{filtered.length}</strong> 条 / 共 {terms.length} 条
        </p>

        {/* ── Term Cards Grid ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            没有找到「{query}」相关术语
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filtered.map((term) => {
              const color = CATEGORY_COLOR[term.category];
              return (
                <div
                  key={term.id}
                  style={{
                    background: 'var(--dark-3)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderRadius: 12,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    cursor: 'default',
                    transition: 'transform 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: color, letterSpacing: 0.5 }}>
                      {term.abbr}
                    </span>
                    {/* 分类标签：点击可切换筛选 */}
                    <button
                      type="button"
                      onClick={() => setActiveCategory(term.category)}
                      style={{
                        fontSize: 10, padding: '3px 10px', borderRadius: 10,
                        background: color + '22', color: color, fontWeight: 600,
                        border: `1px solid ${color}44`,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {term.category}
                    </button>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>
                    {term.en}
                  </p>

                  <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
                    {term.zh}
                  </p>

                  {term.note && (
                    <p style={{
                      fontSize: 11, color: '#94a3b8',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 6, padding: '4px 8px', marginTop: 2,
                    }}>
                      {term.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer style={{
        textAlign: 'center', padding: '24px 16px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 12, color: 'var(--muted)',
      }}>
        OPTEC Express DX室 · Incoterms® 2020 準拠
      </footer>
    </div>
  );
}
