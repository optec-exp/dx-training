'use client';
import { useState, useEffect } from 'react';
import { AIRPORTS, REGIONS, Airport } from '@/data/airports';

const REGION_COLORS: Record<string, string> = {
  '亚洲': '#60a5fa', '欧洲': '#34d399', '北美': '#f59e0b',
  '中东': '#a78bfa', '大洋洲': '#f87171', '南美': '#fb923c',
};

export default function Home() {
  const [query,    setQuery]    = useState('');
  const [debounced,setDebounced]= useState('');
  const [region,   setRegion]   = useState<string>('全部');
  const [results,  setResults]  = useState<Airport[]>([]);
  const [selected, setSelected] = useState<Airport | null>(null);

  // ── Debounce: 用户停止输入 300ms 后才更新 debounced ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query.trim().toUpperCase());
    }, 300);
    return () => clearTimeout(timer); // 每次 query 变化时取消上一个 timer
  }, [query]);

  // ── 过滤: 当 debounced 或 region 变化时执行搜索 ──
  useEffect(() => {
    const filtered = AIRPORTS.filter(a => {
      const matchRegion = region === '全部' || a.region === region;
      const matchQuery  = !debounced || (
        a.iata.includes(debounced)      ||
        a.icao.includes(debounced)      ||
        a.name_en.toUpperCase().includes(debounced) ||
        a.name_zh.includes(debounced)   ||
        a.city_zh.includes(debounced)   ||
        a.country.includes(debounced)
      );
      return matchRegion && matchQuery;
    });
    setResults(filtered);
    setSelected(null);
  }, [debounced, region]);

  // 初始化：显示全部
  useEffect(() => { setResults(AIRPORTS); }, []);

  const mapSrc = selected
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${selected.lng - 0.15},${selected.lat - 0.1},${selected.lng + 0.15},${selected.lat + 0.1}&layer=mapnik&marker=${selected.lat},${selected.lng}`
    : null;

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
        <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>Airport Code Search</span>
      </header>

      {/* Hero + Search */}
      <section style={{ padding: '100px 6% 36px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(201,169,110,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '860px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase' }}>✈ Airport Code Search</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(28px,4vw,52px)', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>
            机场代码搜索工具
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '28px' }}>
            {AIRPORTS.length} 座机场 · 支持 IATA / ICAO 代码 · 机场名 · 城市 · 国家搜索 · 含地图定位
          </p>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder="输入机场代码或名称... （如：NRT、Heathrow、东京、Dubai）"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', background: 'var(--dark-3)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                padding: '14px 48px', color: '#fff', fontSize: '14px',
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setDebounced(''); }} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
            )}
          </div>

          {/* Region Filter */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['全部', ...REGIONS] as const).map(r => {
              const color = r === '全部' ? 'var(--gold)' : REGION_COLORS[r];
              const active = region === r;
              return (
                <button key={r} onClick={() => setRegion(r)} style={{
                  padding: '6px 16px', borderRadius: '20px', border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                  background: active ? `${color}20` : 'transparent',
                  color: active ? color : 'var(--muted)',
                  fontSize: '12px', fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.2s',
                }}>{r}</button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results + Map */}
      <section style={{ padding: '32px 6%' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: '24px', alignItems: 'start' }}>

          {/* Airport List */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '16px', letterSpacing: '1px' }}>
              共 {results.length} 个结果 {debounced && `· 搜索"${debounced}"`}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
              {results.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>✈</div>
                  <div>未找到匹配的机场</div>
                </div>
              ) : results.map(ap => {
                const color = REGION_COLORS[ap.region];
                const isActive = selected?.iata === ap.iata;
                return (
                  <div key={ap.iata} onClick={() => setSelected(isActive ? null : ap)} style={{
                    background: isActive ? `${color}12` : 'var(--dark-3)',
                    borderRadius: '12px', padding: '16px 18px', cursor: 'pointer',
                    border: `1px solid ${isActive ? color + '45' : 'rgba(255,255,255,0.05)'}`,
                    borderLeft: `3px solid ${color}`, transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 700, color: '#fff' }}>{ap.iata}</span>
                      <span style={{ fontSize: '10px', color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: '8px', padding: '2px 8px' }}>{ap.icao}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8e8f0', marginBottom: '2px' }}>{ap.name_zh}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{ap.city_zh} · {ap.country}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail + Map */}
          {selected && (
            <div style={{ position: 'sticky', top: '84px', animation: 'fadeIn 0.25s ease' }}>
              <style>{`@keyframes fadeIn { from { opacity:0; transform:translateX(12px); } to { opacity:1; transform:translateX(0); } }`}</style>

              {/* Info Card */}
              <div style={{ background: 'var(--dark-3)', borderRadius: '14px', padding: '24px', border: `1px solid ${REGION_COLORS[selected.region]}30`, marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{selected.iata}</div>
                    <div style={{ fontSize: '12px', color: REGION_COLORS[selected.region], marginTop: '4px', letterSpacing: '1px' }}>ICAO: {selected.icao}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>
                {[
                  { label: '机场名称（中文）', value: selected.name_zh },
                  { label: 'Airport Name', value: selected.name_en },
                  { label: '城市 / 国家', value: `${selected.city_zh} · ${selected.country}` },
                  { label: '地区', value: selected.region },
                  { label: '坐标', value: `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '10px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
                    <span style={{ fontSize: '13px', color: '#e8e8f0' }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Map */}
              <div style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--muted)', padding: '8px 14px', background: 'var(--dark-3)', textTransform: 'uppercase' }}>
                  📍 OpenStreetMap
                </div>
                <iframe
                  src={mapSrc!}
                  width="100%"
                  height="260"
                  style={{ border: 'none', display: 'block' }}
                  title={`Map of ${selected.name_en}`}
                />
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
