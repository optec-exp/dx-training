'use client';

import { useState, useEffect, useMemo } from 'react';
import { terms, CATEGORIES, type Category } from '@/data/terms';

const CATEGORY_COLOR: Record<string, string> = {
  '单证类':   '#3b82f6',
  '重量计费': '#10b981',
  '时间航班': '#f59e0b',
  '贸易术语': '#8b5cf6',
};

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
  const [query, setQuery]                 = useState('');
  const [activeCategory, setActiveCategory] = useState<'全部' | Category>('全部');

  // query / activeCategory が変わるたびに即座に再計算
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

  // 検索結果件数をページタイトルに反映する
  useEffect(() => {
    document.title =
      filtered.length === terms.length
        ? 'OPTEC 物流术语词典'
        : `OPTEC 词典 — ${filtered.length} 条`;
  }, [filtered.length]);

  // 「全部」のとき各カテゴリでグルーピング、それ以外は1グループのみ
  const groups = useMemo(() => {
    if (activeCategory !== '全部') {
      return [{ category: activeCategory as Category, items: filtered }];
    }
    return CATEGORIES.map((cat) => ({
      category: cat,
      items: filtered.filter((t) => t.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [filtered, activeCategory]);

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

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '32px 16px' }}>

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
              width: '100%', padding: '12px 16px 12px 42px',
              background: C.bg3, border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 10, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          )}
        </div>

        {/* ── Category Tabs ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {(['全部', ...CATEGORIES] as Array<'全部' | Category>).map((cat) => {
            const isActive = activeCategory === cat;
            const color    = cat === '全部' ? '#64748b' : CATEGORY_COLOR[cat];
            const count    = cat === '全部' ? terms.length : terms.filter(t => t.category === cat).length;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '9px 22px', borderRadius: 24,
                  border:     isActive ? `2px solid ${color}` : `2px solid rgba(255,255,255,0.2)`,
                  background: isActive ? color : C.bg3,
                  color:      isActive ? '#fff' : C.muted,
                  cursor: 'pointer', fontSize: 14, fontWeight: isActive ? 700 : 500,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 4px 14px ${color}55` : 'none',
                  outline: 'none',
                }}
              >
                {cat}
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)',
                  borderRadius: 12, padding: '1px 8px', fontSize: 12, fontWeight: 700,
                  color: isActive ? '#fff' : C.muted,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 结果数 ── */}
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
          显示 <strong style={{ color: C.text }}>{filtered.length}</strong> 条 / 共 {terms.length} 条
        </p>

        {/* ── 无结果 ── */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted, fontSize: 15 }}>
            没有找到「{query}」相关术语
          </div>
        )}

        {/* ── 按分类分组渲染 ── */}
        {groups.map(({ category, items }) => {
          const color = CATEGORY_COLOR[category];
          return (
            <section key={category} style={{ marginBottom: 48 }}>

              {/* 分类区块标题 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16,
                paddingBottom: 12, borderBottom: `2px solid ${color}44`,
              }}>
                <span style={{
                  background: color, color: '#fff',
                  padding: '4px 16px', borderRadius: 20,
                  fontSize: 14, fontWeight: 700,
                }}>
                  {category}
                </span>
                <span style={{ color: C.muted, fontSize: 13 }}>
                  {items.length} 条
                </span>
                {activeCategory === '全部' && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    style={{
                      marginLeft: 'auto', fontSize: 12, color: color,
                      background: color + '22', border: `1px solid ${color}55`,
                      borderRadius: 8, padding: '3px 12px', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    只看此类 →
                  </button>
                )}
              </div>

              {/* 词条卡片网格 */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 14,
              }}>
                {items.map((term) => (
                  <div
                    key={term.id}
                    style={{
                      background: C.bg3, border: `1px solid rgba(255,255,255,0.08)`,
                      borderRadius: 12, padding: '16px 18px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                      transition: 'transform 0.15s, border-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color;
                      e.currentTarget.style.transform   = 'translateY(-3px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.transform   = 'none';
                    }}
                  >
                    <p style={{ fontSize: 20, fontWeight: 800, color: color, margin: 0 }}>
                      {term.abbr}
                    </p>
                    <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.5 }}>
                      {term.en}
                    </p>
                    <p style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
                      {term.zh}
                    </p>
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
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer style={{
        textAlign: 'center', padding: '28px 16px',
        borderTop: `1px solid ${C.border}`,
        fontSize: 12, color: '#334155', marginTop: 20,
      }}>
        OPTEC Express DX室 · Incoterms® 2020 準拠
      </footer>
    </div>
  );
}
