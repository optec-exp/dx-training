'use client';

import { useState, useEffect, useMemo } from 'react';
import { terms, CATEGORIES, type Category } from '@/data/terms';

// 各分类对应的颜色
const CATEGORY_COLOR: Record<string, string> = {
  '单证类':   '#3b82f6',
  '重量计费': '#10b981',
  '时间航班': '#f59e0b',
  '贸易术语': '#8b5cf6',
};

// ─── 颜色常量（硬编码，CSS 变量加载失败时也能正常显示）───
const C = {
  bg:     '#030b18',
  bg2:    '#071428',
  bg3:    '#0d1f3c',
  border: 'rgba(255,255,255,0.1)',
  text:   '#e2e8f0',
  muted:  '#94a3b8',
  sky:    '#60a5fa',
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

  // useEffect: 検索結果をページタイトルに反映する
  useEffect(() => {
    document.title =
      filtered.length === terms.length
        ? 'OPTEC 物流术语词典'
        : `OPTEC 词典 — ${filtered.length} 条`;
  }, [filtered.length]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter','PingFang SC','Microsoft YaHei',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{
        background: C.bg2,
        borderBottom: `1px solid ${C.border}`,
        padding: '32px 24px 24px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, letterSpacing: 4, color: C.sky, marginBottom: 8, textTransform: 'uppercase' }}>
          OPTEC Express
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6, color: C.text }}>
          物流术语词典
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          航空货运专业术语 · 中英对照 · 共 {terms.length} 条
        </p>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── Search Box ── */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 16, color: C.muted, pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="搜索术语…（英文缩写 / 全称 / 中文均可）"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              background: C.bg3,
              border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 10,
              color: C.text,
              fontSize: 15,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18,
              }}
            >✕</button>
          )}
        </div>

        {/* ── Category Tabs ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
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
                  padding: '9px 22px',
                  borderRadius: 24,
                  border: isActive ? `2px solid ${color}` : `2px solid rgba(255,255,255,0.2)`,
                  background: isActive ? color : C.bg3,
                  color: isActive ? '#ffffff' : C.muted,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 4px 14px ${color}55` : 'none',
                  outline: 'none',
                }}
              >
                {cat}
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  padding: '1px 8px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: isActive ? '#fff' : C.muted,
                  minWidth: 24,
                  textAlign: 'center',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Result Count ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: C.muted }}>
          {activeCategory !== '全部' && (
            <span style={{
              background: CATEGORY_COLOR[activeCategory] + '33',
              color: CATEGORY_COLOR[activeCategory],
              padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 700,
              border: `1px solid ${CATEGORY_COLOR[activeCategory]}55`,
            }}>
              {activeCategory}
            </span>
          )}
          <span>
            显示 <strong style={{ color: C.text, fontSize: 15 }}>{filtered.length}</strong> 条 / 共 {terms.length} 条
          </span>
        </div>

        {/* ── Term Cards Grid ── */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted, fontSize: 15 }}>
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
                    background: C.bg3,
                    border: `1px solid rgba(255,255,255,0.08)`,
                    borderRadius: 12,
                    padding: '18px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7,
                    transition: 'transform 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  {/* 上段: 略称 + 分类标签（点击可切换筛选） */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: color, letterSpacing: 0.3 }}>
                      {term.abbr}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveCategory(term.category)}
                      title={`点击筛选「${term.category}」`}
                      style={{
                        fontSize: 10, padding: '3px 10px', borderRadius: 10,
                        background: color + '22',
                        color: color,
                        fontWeight: 700,
                        border: `1px solid ${color}55`,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        outline: 'none',
                      }}
                    >
                      {term.category}
                    </button>
                  </div>

                  {/* 英文全称 */}
                  <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, margin: 0 }}>
                    {term.en}
                  </p>

                  {/* 中文含义 */}
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
                    {term.zh}
                  </p>

                  {/* 备注 */}
                  {term.note && (
                    <p style={{
                      fontSize: 11, color: '#64748b',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 6, padding: '4px 10px', margin: 0,
                    }}>
                      📌 {term.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer style={{
        textAlign: 'center', padding: '28px 16px',
        borderTop: `1px solid ${C.border}`,
        fontSize: 12, color: '#334155', marginTop: 40,
      }}>
        OPTEC Express DX室 · Incoterms® 2020 準拠
      </footer>
    </div>
  );
}
