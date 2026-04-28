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
  green:  '#10b981',
  accent: '#3b82f6',
};

type AirportItem = typeof airports[0];

// 按机场数量降序排列国家列表（模块级，只算一次）
const COUNTRY_LIST = (() => {
  const counts: Record<string, number> = {};
  airports.forEach(a => { counts[a.country] = (counts[a.country] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
})();

export default function AirportSearch() {
  const [query, setQuery]              = useState('');
  const [debouncedQuery, setDebounced] = useState('');
  const [activeCountry, setCountry]    = useState('全部');
  const [selected, setSelected]        = useState<AirportItem | null>(null);

  // ── 防抖：停止输入 300ms 后更新 debouncedQuery ──
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // ── 过滤机场 ──
  const filtered = useMemo(() => {
    return airports.filter(a => {
      const matchCountry = activeCountry === '全部' || a.country === activeCountry;
      if (!debouncedQuery) return matchCountry;
      const q = debouncedQuery;
      return matchCountry && (
        a.iata.toLowerCase().includes(q) ||
        a.icao.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.city.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
      );
    });
  }, [debouncedQuery, activeCountry]);

  // ── 按城市分组 ──
  const groups = useMemo(() => {
    const map = new Map<string, AirportItem[]>();
    filtered.forEach(a => {
      const key = `${a.city}||${a.country}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return Array.from(map.entries()).map(([key, items]) => {
      const [city, country] = key.split('||');
      return { city, country, items };
    });
  }, [filtered]);

  // ── Google Maps iframe src ──
  const mapSrc = selected
    ? `https://maps.google.com/maps?q=${encodeURIComponent(
        selected.iata + ' airport ' + selected.city + ' ' + selected.country
      )}&output=embed&hl=zh-CN`
    : '';

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: C.bg, color: C.text,
      fontFamily: "'Inter','PingFang SC','Microsoft YaHei',sans-serif",
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <header style={{
        background: C.bg2, borderBottom: `1px solid ${C.border}`,
        padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 24,
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 3, color: C.sky, textTransform: 'uppercase', marginBottom: 2 }}>
            OPTEC Express
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>机场代码搜索</h1>
        </div>
        <p style={{ fontSize: 12, color: C.muted, marginLeft: 'auto' }}>
          全球 {airports.length} 个机场 · IATA / ICAO
        </p>
      </header>

      {/* ── Search + Country Tabs ── */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '12px 16px', flexShrink: 0 }}>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, color: C.muted, pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="搜索 IATA / ICAO 代码、机场名、城市、国家…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 36px 10px 36px',
              background: C.bg3, border: `1px solid rgba(255,255,255,0.12)`,
              borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
            }}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(''); setSelected(null); }} style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 16,
            }}>✕</button>
          )}
        </div>

        {/* Country Tabs — horizontally scrollable */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {(['全部', ...COUNTRY_LIST] as string[]).map((country) => {
            const isActive = activeCountry === country;
            const cnt = country === '全部'
              ? airports.length
              : airports.filter(a => a.country === country).length;
            return (
              <button
                type="button"
                key={country}
                onClick={() => { setCountry(country); setSelected(null); }}
                style={{
                  flexShrink: 0,
                  padding: '5px 14px', borderRadius: 20,
                  border:     `1.5px solid ${isActive ? C.accent : 'rgba(255,255,255,0.18)'}`,
                  background: isActive ? C.accent : 'transparent',
                  color:      isActive ? '#fff' : C.muted,
                  cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 400,
                  whiteSpace: 'nowrap', outline: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {country}
                <span style={{
                  marginLeft: 5, fontSize: 10,
                  background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: '1px 5px',
                }}>
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main: Left List  |  Right Map ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Airport List ── */}
        <div style={{
          width: '50%', overflowY: 'auto', padding: '14px 14px',
          borderRight: `1px solid ${C.border}`,
        }}>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
            显示 <strong style={{ color: C.text }}>{filtered.length}</strong> 条 / 共 {airports.length} 条
          </p>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', paddingTop: 60, color: C.muted, fontSize: 14 }}>
              没有找到「{query}」相关机场
            </div>
          )}

          {groups.map(({ city, country, items }) => (
            <div key={`${city}-${country}`} style={{ marginBottom: 18 }}>

              {/* City header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 8, paddingBottom: 6,
                borderBottom: `1px solid rgba(255,255,255,0.06)`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{city}</span>
                {activeCountry === '全部' && (
                  <span style={{ fontSize: 11, color: C.muted }}>· {country}</span>
                )}
                <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>
                  {items.length} 个机场
                </span>
              </div>

              {/* Airport cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
                gap: 8,
              }}>
                {items.map((airport) => {
                  const isSelected = selected?.iata === airport.iata;
                  return (
                    <div
                      key={airport.iata}
                      onClick={() => setSelected(isSelected ? null : airport)}
                      style={{
                        background:   isSelected ? C.accent + '28' : C.bg3,
                        border:       `2px solid ${isSelected ? C.accent : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10, padding: '10px 12px',
                        cursor: 'pointer', transition: 'border-color 0.12s, transform 0.12s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = C.sky;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      {/* IATA / ICAO */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: isSelected ? C.accent : C.sky }}>
                          {airport.iata}
                        </span>
                        {airport.icao && (
                          <span style={{
                            fontSize: 10, color: C.green,
                            background: C.green + '18',
                            borderRadius: 4, padding: '1px 5px',
                          }}>
                            {airport.icao}
                          </span>
                        )}
                      </div>
                      {/* Airport Name */}
                      <p style={{ fontSize: 10, color: C.muted, margin: 0, lineHeight: 1.4 }}>
                        {airport.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Right: Google Maps ── */}
        <div style={{ width: '50%', position: 'relative', background: '#020a14' }}>

          {/* Selected Airport Info Bar */}
          {selected && (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
              background: 'rgba(7,20,40,0.92)', backdropFilter: 'blur(8px)',
              borderBottom: `1px solid ${C.border}`,
              padding: '10px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.sky }}>{selected.iata}</span>
              {selected.icao && (
                <span style={{
                  fontSize: 11, color: C.green, background: C.green + '22',
                  borderRadius: 5, padding: '2px 7px',
                }}>
                  {selected.icao}
                </span>
              )}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 12, color: C.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selected.name}
                </p>
                <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>
                  {selected.city} · {selected.country}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)', border: 'none', color: C.muted,
                  cursor: 'pointer', borderRadius: 6, padding: '4px 8px', fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* Map Placeholder */}
          {!selected && (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: C.muted, gap: 12,
            }}>
              <span style={{ fontSize: 48 }}>🗺️</span>
              <p style={{ fontSize: 14, margin: 0 }}>点击左边的机场卡片</p>
              <p style={{ fontSize: 12, margin: 0, color: '#475569' }}>即可在此查看 Google Maps 地图</p>
            </div>
          )}

          {/* Google Maps iframe */}
          {selected && (
            <iframe
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', paddingTop: 52 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${selected.iata} map`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
