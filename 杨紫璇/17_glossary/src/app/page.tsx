'use client';
import { useState, useEffect } from 'react';
import { TERMS, CATEGORIES, Term, Category } from '@/data/terms';

const CATEGORY_COLORS: Record<Category, string> = {
  '运输':   '#60a5fa',
  '通关':   '#34d399',
  '文件':   '#a78bfa',
  '计费':   '#c9a96e',
  '特殊货物': '#f87171',
  '基础':   '#94a3b8',
};

export default function Home() {
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState<Category | '全部'>('全部');
  const [filtered, setFiltered] = useState<Term[]>(TERMS);
  const [selected, setSelected] = useState<Term | null>(null);

  // useEffect: 每当搜索词或分类变化时，重新过滤术语列表
  useEffect(() => {
    const q = query.toLowerCase().trim();
    const result = TERMS.filter(t => {
      const matchCategory = category === '全部' || t.category === category;
      const matchQuery    = !q || (
        t.abbr.toLowerCase().includes(q) ||
        t.en.toLowerCase().includes(q)   ||
        t.zh.includes(q)                 ||
        t.ja.includes(q)                 ||
        t.desc_zh.includes(q)
      );
      return matchCategory && matchQuery;
    });
    setFiltered(result);
    setSelected(null);
  }, [query, category]);

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', background: 'rgba(8,8,15,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px' }}>OPTEC</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>EXPRESS</span>
        </div>
        <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>Glossary</span>
      </header>

      {/* Hero + Search */}
      <section style={{ padding: '100px 6% 40px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(201,169,110,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase' }}>📖 Air Cargo Glossary</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,48px)', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>
            航空货运术语词典
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '28px' }}>
            35条专业术语 · 日本語 / English / 中文 · 分类过滤 · 即时搜索
          </p>

          {/* Search Bar */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder="搜索术语... （如：AWB、通关、Delivery）"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '14px 16px 14px 48px', color: '#fff', fontSize: '14px',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            )}
          </div>

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['全部', ...CATEGORIES] as const).map(cat => {
              const color = cat === '全部' ? 'var(--gold)' : CATEGORY_COLORS[cat as Category];
              const active = category === cat;
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                    background: active ? `${color}20` : 'transparent',
                    color: active ? color : 'var(--muted)',
                    fontSize: '12px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >{cat}</button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section style={{ padding: '32px 6%', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '20px', letterSpacing: '1px' }}>
          共 {filtered.length} 条结果 {query && `· 搜索"${query}"`} {category !== '全部' && `· 分类：${category}`}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 360px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Term Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
                <div>未找到匹配术语</div>
              </div>
            ) : filtered.map(term => {
              const color = CATEGORY_COLORS[term.category];
              const isActive = selected?.id === term.id;
              return (
                <div
                  key={term.id}
                  onClick={() => setSelected(isActive ? null : term)}
                  style={{
                    background: isActive ? `${color}10` : 'var(--dark-3)',
                    borderRadius: '12px', padding: '20px', cursor: 'pointer',
                    border: `1px solid ${isActive ? color + '40' : 'rgba(255,255,255,0.05)'}`,
                    borderLeft: `3px solid ${color}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700, color: '#fff' }}>{term.abbr}</div>
                    <span style={{ fontSize: '10px', letterSpacing: '1px', color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: '10px', padding: '2px 8px' }}>{term.category}</span>
                  </div>
                  <div style={{ fontSize: '11px', color, marginBottom: '4px', fontWeight: 500 }}>{term.en}</div>
                  <div style={{ fontSize: '12px', color: '#e8e8f0', marginBottom: '2px' }}>{term.zh}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{term.ja}</div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {selected && (
            <div style={{ position: 'sticky', top: '84px', background: 'var(--dark-3)', borderRadius: '16px', padding: '28px', border: `1px solid ${CATEGORY_COLORS[selected.category]}30`, animation: 'fadeIn 0.25s ease' }}>
              <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }`}</style>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{selected.abbr}</div>
                  <div style={{ fontSize: '10px', letterSpacing: '1px', color: CATEGORY_COLORS[selected.category], marginTop: '6px' }}>{selected.category}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
              </div>

              {[
                { lang: '🇬🇧 English', value: selected.en },
                { lang: '🇨🇳 中文',    value: selected.zh },
                { lang: '🇯🇵 日本語',  value: selected.ja },
              ].map(({ lang, value }) => (
                <div key={lang} style={{ marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '4px' }}>{lang}</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{value}</div>
                </div>
              ))}

              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '8px' }}>解说（中文）</div>
                <div style={{ fontSize: '12px', color: '#e8e8f0', lineHeight: 1.9 }}>{selected.desc_zh}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px', marginBottom: '8px' }}>解説（日本語）</div>
                <div style={{ fontSize: '12px', color: '#e8e8f0', lineHeight: 1.9 }}>{selected.desc_ja}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '28px 6%', textAlign: 'center', marginTop: '40px' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px', marginBottom: '6px' }}>OPTEC EXPRESS</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Global Urgent Logistics Since 2016</div>
      </footer>
    </div>
  );
}
