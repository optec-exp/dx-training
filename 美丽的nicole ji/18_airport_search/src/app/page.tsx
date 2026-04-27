'use client';

import { useState, useEffect, useMemo } from 'react';
import { airports } from '@/data/airports';

const C = {
  bg:     '#030b18',
  bg2:    '#071428',
  bg3:    '#0d1f3c',
  border: 'rgba(255,255,255,0.1)',
  text:   '#e2e8f0',
  muted:  '#94a3b8',
  sky:    '#60a5fa',
  accent: '#3b82f6',
  green:  '#10b981',
};

type AirportItem = typeof airports[0];

export default function AirportSearch() {
  const [query, setQuery]               = useState('');
  const [debouncedQuery, setDebounced]  = useState('');
  const [selected, setSelected]         = useState<AirportItem | null>(null);

  // ── 防抖：用户停止输入 300ms 后才更新 debouncedQuery ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);   // 清除上一次计时器
  }, [query]);

  // ── 用 debouncedQuery 过滤结果 ──
  const filtered = useMemo(() => {
    if (!debouncedQuery) return airports;
    const q = debouncedQuery;
    return airports.filter(a =>
      a.iata.toLowerCase().includes(q) ||
      a.icao.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    );
  }, [debouncedQuery]);

  // ── 页面标题随搜索变化 ──
  useEffect(() => {
    document.title = filtered.length === airports.length
      ? 'OPTEC 机场代码搜索'
      : `OPTEC 机场 — ${filtered.length} 条`;
  }, [filtered.length]);

  const mapSrc = selected
    ? `https://maps.google.com/maps?q=${encodeURIComponent(selected.iata + ' airport ' + selected.city + ' ' + selected.country)}&output=embed&hl=zh-CN`
    : '';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter','PingFang SC','Microsoft YaHei',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '32px 24px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, color: C.sky, marginBottom: 8, textTransform: 'uppercase' }}>
          OPTEC Express
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
          机场代码搜索
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>
          IATA · ICAO · 全球 {airports.length} 个机场
        </p>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 16px' }}>

        {/* ── Search ── */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.muted, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="搜索 IATA / ICAO 代码、机场名、城市、国家…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '13px 16px 13px 44px',
              background: C.bg3, border: `1px solid rgba(255,255,255,0.15)`,
              borderRadius: 10, color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSelected(null); }} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          )}
        </div>

        {/* ── Count ── */}
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
          显示 <strong style={{ color: C.text }}>{filtered.length}</strong> 条 / 共 {airports.length} 条
        </p>

        {/* ── Map Panel ── */}
        {selected && (
          <div style={{
            marginBottom: 32, background: C.bg3,
            border: `2px solid ${C.accent}`,
            borderRadius: 16, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', background: C.bg2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: C.sky }}>{selected.iata}</span>
                {selected.icao && (
                  <span style={{ fontSize: 12, color: C.green, background: C.green + '22', padding: '2px 8px', borderRadius: 6 }}>
                    {selected.icao}
                  </span>
                )}
                <span style={{ fontSize: 14, color: C.text }}>{selected.name}</span>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={{
                background: 'rgba(255,255,255,0.08)', border: 'none', color: C.muted,
                cursor: 'pointer', fontSize: 16, borderRadius: 8, padding: '4px 10px',
              }}>✕ 关闭地图</button>
            </div>
            <iframe
              src={mapSrc}
              width="100%"
              height="380"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${selected.iata} map`}
            />
          </div>
        )}

        {/* ── No Result ── */}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted, fontSize: 15 }}>
            没有找到「{query}」相关机场
          </div>
        )}

        {/* ── Airport Cards Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 12,
        }}>
          {filtered.map((airport) => {
            const isSelected = selected?.iata === airport.iata;
            return (
              <div
                key={airport.iata}
                onClick={() => setSelected(isSelected ? null : airport)}
                style={{
                  background:   isSelected ? C.accent + '22' : C.bg3,
                  border:       `2px solid ${isSelected ? C.accent : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 12, padding: '14px 16px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, transform 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
                onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = C.sky; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; } }}
              >
                {/* IATA / ICAO */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: isSelected ? C.accent : C.sky }}>
                    {airport.iata}
                  </span>
                  {airport.icao && (
                    <span style={{
                      fontSize: 11, color: C.green,
                      background: C.green + '1a',
                      borderRadius: 5, padding: '1px 6px',
                    }}>
                      {airport.icao}
                    </span>
                  )}
                </div>

                {/* Airport Name */}
                <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>
                  {airport.name}
                </p>

                {/* City / Country */}
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                  {airport.city}
                </p>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  {airport.country}
                </p>

                {/* Map hint */}
                {isSelected && (
                  <p style={{ fontSize: 11, color: C.accent, margin: '4px 0 0', fontWeight: 600 }}>
                    📍 地图已展开 ↑
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>

      <footer style={{
        textAlign: 'center', padding: '28px 16px',
        borderTop: `1px solid ${C.border}`,
        fontSize: 12, color: '#334155', marginTop: 20,
      }}>
        OPTEC Express DX室 · IATA / ICAO Airport Code Reference
      </footer>
    </div>
  );
}
