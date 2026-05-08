'use client';
import { useState, useMemo, useEffect } from 'react';

interface City { name: string; en: string; flag: string; tz: string; std: number; }

const CITIES: City[] = [
  { name: '東京',     en: 'Tokyo',       flag: '🇯🇵', tz: 'Asia/Tokyo',          std: 9  },
  { name: '上海',     en: 'Shanghai',    flag: '🇨🇳', tz: 'Asia/Shanghai',       std: 8  },
  { name: '法兰克福',  en: 'Frankfurt',   flag: '🇩🇪', tz: 'Europe/Berlin',       std: 1  },
  { name: '芝加哥',   en: 'Chicago',     flag: '🇺🇸', tz: 'America/Chicago',     std: -6 },
  { name: '墨西哥城', en: 'Mexico City', flag: '🇲🇽', tz: 'America/Mexico_City', std: -6 },
];

const p2 = (n: number) => String(n).padStart(2, '0');

function getOffset(tz: string, d: Date): number {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: tz, timeZoneName: 'shortOffset',
  }).formatToParts(d);
  const s = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
  const m = s.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  return (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) + parseInt(m[3] ?? '0') / 60);
}

function parseInTZ(dtStr: string, tz: string): Date {
  const [datePart, timePart] = dtStr.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number);
  // 2-pass: first approx, then correct for DST
  const approx = new Date(Date.UTC(y, mo - 1, d, h - getOffset(tz, new Date()), mi));
  const off = getOffset(tz, approx);
  return new Date(Date.UTC(y, mo - 1, d, h - off, mi));
}

function fmtTime(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(d);
}

function fmtDate(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz, year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  }).format(d);
}

function diffLabel(absH: number): string {
  const hh = Math.floor(absH);
  const mm = Math.round((absH - hh) * 60);
  return mm ? `${hh}小时${mm}分钟` : `${hh}小时`;
}

function nowStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${p2(n.getMonth() + 1)}-${p2(n.getDate())}T${p2(n.getHours())}:${p2(n.getMinutes())}`;
}

export default function Page() {
  const [base, setBase] = useState(0);
  const [dt, setDt] = useState<string>(nowStr);
  const [live, setLive] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const ref = useMemo(() => {
    // tick in deps forces re-run every second when live=true
    return live ? new Date(tick >= 0 ? Date.now() : 0) : parseInTZ(dt, CITIES[base].tz);
  }, [dt, base, live, tick]);

  const cards = useMemo(() => CITIES.map((c, i) => {
    const off = getOffset(c.tz, ref);
    const baseOff = getOffset(CITIES[base].tz, ref);
    return {
      ...c,
      off,
      dst: off !== c.std,
      time: fmtTime(ref, c.tz),
      date: fmtDate(ref, c.tz),
      diff: off - baseOff,
      isBase: i === base,
    };
  }), [ref, base]);

  const toggleLive = () => {
    if (!live) setDt(nowStr());
    setLive(v => !v);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#030b18', color: '#e2e8f0',
      fontFamily: 'system-ui, "Segoe UI", sans-serif', padding: '28px 24px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
          🌏 OPTEC 時区変換ツール
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
          夏令时自动判断 · 输入任意时间，查看各城市对应时刻 · 点击城市卡片切换基准
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
        padding: '18px 20px', marginBottom: '24px',
        display: 'flex', flexWrap: 'wrap', gap: '16px',
        alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            基准城市（输入时区）
          </span>
          <select
            value={base}
            onChange={e => setBase(Number(e.target.value))}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
              color: '#e2e8f0', padding: '8px 12px', fontSize: '14px',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {CITIES.map((c, i) => (
              <option key={i} value={i}>{c.flag} {c.name} ({c.en})</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            输入时间
          </span>
          <input
            type="datetime-local"
            value={dt}
            onChange={e => { setLive(false); setDt(e.target.value); }}
            style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
              color: '#e2e8f0', padding: '8px 12px', fontSize: '14px', outline: 'none',
            }}
          />
        </label>

        <button
          onClick={toggleLive}
          style={{
            background: live ? '#0369a1' : '#1e293b',
            border: `2px solid ${live ? '#0ea5e9' : '#334155'}`,
            borderRadius: '8px', color: live ? '#7dd3fc' : '#94a3b8',
            padding: '8px 20px', fontSize: '14px', cursor: 'pointer', fontWeight: 700,
          }}
        >
          {live ? '⏸ 实时更新中' : '▶ 使用当前时间'}
        </button>
      </div>

      {/* City Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {cards.map((c, i) => (
          <div
            key={i}
            onClick={() => setBase(i)}
            style={{
              background: c.isBase ? '#0c1a2e' : '#0f172a',
              border: `1px solid ${c.isBase ? '#0ea5e9' : '#1e293b'}`,
              borderRadius: '14px', padding: '20px 18px',
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
          >
            {c.isBase && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
              }} />
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '28px', lineHeight: 1 }}>{c.flag}</div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#f1f5f9', marginTop: '6px' }}>{c.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{c.en}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                  background: '#1e293b', padding: '3px 8px', borderRadius: '5px',
                }}>
                  {`UTC${c.off >= 0 ? '+' : ''}${c.off}`}
                </span>
                {c.dst ? (
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#fbbf24',
                    background: '#451a0333', border: '1px solid #fbbf2444',
                    padding: '2px 7px', borderRadius: '5px',
                  }}>
                    ☀️ 夏令时
                  </span>
                ) : (
                  <span style={{
                    fontSize: '10px', fontWeight: 600, color: '#475569',
                    background: '#1e293b', padding: '2px 7px', borderRadius: '5px',
                  }}>
                    标准时
                  </span>
                )}
              </div>
            </div>

            {/* Time */}
            <div style={{
              fontSize: '28px', fontWeight: 800, letterSpacing: '1px', lineHeight: 1.1,
              color: c.isBase ? '#38bdf8' : '#f1f5f9',
            }}>
              {c.time}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px', marginBottom: '14px' }}>
              {c.date}
            </div>

            {/* Diff */}
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
              {c.isBase ? (
                <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                  📍 基准城市
                </span>
              ) : (
                <span style={{ fontSize: '13px', fontWeight: 700, color: c.diff > 0 ? '#34d399' : '#f87171' }}>
                  {c.diff > 0 ? '▲ 快 ' : '▼ 慢 '}{diffLabel(Math.abs(c.diff))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '24px', display: 'flex', gap: '28px',
        justifyContent: 'center', flexWrap: 'wrap',
        padding: '14px', background: '#0a1120', borderRadius: '10px',
      }}>
        {[
          { sym: '━━', color: '#0ea5e9', text: '蓝框 = 基准城市（可点击切换）' },
          { sym: '☀️', color: '#fbbf24', text: '夏令时 = 比该城市标准时间 +1h' },
          { sym: '▲▼', color: '#94a3b8', text: '绿▲快 / 红▼慢（相对基准城市）' },
        ].map(({ sym, color, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#64748b' }}>
            <span style={{ color, fontWeight: 700 }}>{sym}</span>{text}
          </div>
        ))}
      </div>
    </div>
  );
}
