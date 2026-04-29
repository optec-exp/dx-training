'use client';
import { useState, useMemo, useEffect } from 'react';

interface Flight {
  id: number;
  airline: string;
  route: string;
  days: number[];   // 0=日 1=月 2=火 3=水 4=木 5=金 6=土
  time: string;     // "HH:MM" JST
  nfo: number;      // 起飞前 N 小时截货
  obc: number;
  isPreset: boolean;
}

const DAY_JA = ['日', '月', '火', '水', '木', '金', '土'];

// 常用 NRT→PVG 班次（参考时刻表，请以实际为准）
const INIT: Flight[] = [
  { id: 1, airline: 'CA836',  route: 'NRT → PVG', days: [1, 3, 5],          time: '09:50', nfo: 4, obc: 3, isPreset: true },
  { id: 2, airline: 'NH905',  route: 'NRT → PVG', days: [0,1,2,3,4,5,6],   time: '10:10', nfo: 4, obc: 3, isPreset: true },
  { id: 3, airline: 'MU735',  route: 'NRT → PVG', days: [2, 4, 6],          time: '10:20', nfo: 3, obc: 3, isPreset: true },
  { id: 4, airline: 'JL609',  route: 'NRT → PVG', days: [0,1,2,3,4,5,6],   time: '09:45', nfo: 4, obc: 3, isPreset: true },
];

const mkBlank = () => ({ airline: '', route: '', time: '10:00', days: [] as number[], nfo: 4, obc: 3 });

// 计算下次出发时间（最多向后找7天）
function getNextDep(f: Flight, now: Date): Date {
  for (let d = 0; d <= 7; d++) {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + d);
    const [h, m] = f.time.split(':').map(Number);
    dt.setHours(h, m, 0, 0);
    if (f.days.includes(dt.getDay()) && dt > now) return dt;
  }
  // fallback: 明日同一时刻
  const fb = new Date(now);
  fb.setDate(fb.getDate() + 1);
  const [h, m] = f.time.split(':').map(Number);
  fb.setHours(h, m, 0, 0);
  return fb;
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return '終了';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const mi = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (d > 0) return `${d}日${h}時間${mi}分`;
  if (h > 0) return `${h}時間${mi}分${String(sc).padStart(2, '0')}秒`;
  return `${mi}分${String(sc).padStart(2, '0')}秒`;
}

function fmtDT(dt: Date): string {
  const mo = dt.getMonth() + 1;
  const d = dt.getDate();
  const dow = DAY_JA[dt.getDay()];
  const h = String(dt.getHours()).padStart(2, '0');
  const m = String(dt.getMinutes()).padStart(2, '0');
  return `${mo}/${d}(${dow}) ${h}:${m}`;
}

function urgency(ms: number): { c: string; bg: string; warn: string } {
  if (ms <= 0)              return { c: '#6b7280', bg: '#1e293b33', warn: '' };
  if (ms < 30 * 60000)     return { c: '#ef4444', bg: '#7f1d1d33', warn: '⚡ 30分以内！' };
  if (ms < 2 * 3600000)    return { c: '#f59e0b', bg: '#78350f33', warn: '⏰ 2時間以内' };
  return                          { c: '#10b981', bg: '#05291633', warn: '' };
}

export default function Page() {
  const [flights, setFlights] = useState<Flight[]>(INIT);
  const [tick, setTick]       = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState(mkBlank);

  // 每秒触发重算
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { now, todayDow } = useMemo(() => {
    const n = new Date();
    return { now: n, todayDow: n.getDay() };
  }, [tick]);

  const data = useMemo(() => flights.map(f => {
    const dep    = getNextDep(f, now);
    const nfoCut = new Date(dep.getTime() - f.nfo * 3600000);
    const obcCut = new Date(dep.getTime() - f.obc * 3600000);
    return {
      ...f, dep, nfoCut, obcCut,
      depMs: dep.getTime()    - now.getTime(),
      nfoMs: nfoCut.getTime() - now.getTime(),
      obcMs: obcCut.getTime() - now.getTime(),
    };
  }), [flights, tick]);

  const toggleDay = (d: number) =>
    setForm(p => ({
      ...p,
      days: p.days.includes(d) ? p.days.filter(x => x !== d) : [...p.days, d].sort((a, b) => a - b),
    }));

  const addFlight = () => {
    if (!form.airline || !form.time || form.days.length === 0) return;
    setFlights(p => [...p, { ...form, id: Date.now(), route: form.route || '? → ?', isPreset: false }]);
    setForm(mkBlank());
    setShowAdd(false);
  };

  const IS: React.CSSProperties = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
    color: '#e2e8f0', padding: '7px 10px', fontSize: '13px', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui,"Segoe UI",sans-serif', padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
            ✂️ OPTEC 截货时间倒计时
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>
            NFO / OBC 截货 · 起飞倒计时 · 每周循环班次自动计算次回
          </p>
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{
            background: showAdd ? '#1e0a3c' : '#1e293b',
            border: `1px solid ${showAdd ? '#a78bfa' : '#334155'}`,
            borderRadius: '8px', color: showAdd ? '#c4b5fd' : '#94a3b8',
            padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {showAdd ? '✕ 取消' : '＋ 追加班次'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background: '#0f172a', border: '1px solid #a78bfa44', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#c4b5fd', marginBottom: '14px' }}>
            自定义班次追加
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>便名</span>
              <input value={form.airline} onChange={e => setForm(p => ({...p, airline: e.target.value}))}
                placeholder="CA836" style={{ ...IS, width: '90px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>航线</span>
              <input value={form.route} onChange={e => setForm(p => ({...p, route: e.target.value}))}
                placeholder="NRT → FRA" style={{ ...IS, width: '120px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>出発時刻 (JST)</span>
              <input type="time" value={form.time} onChange={e => setForm(p => ({...p, time: e.target.value}))}
                style={{ ...IS, width: '110px' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>NFO 締切（時間前）</span>
              <select value={form.nfo} onChange={e => setForm(p => ({...p, nfo: Number(e.target.value)}))}
                style={{ ...IS, width: '100px' }}>
                {[1,2,3,4,5,6,8].map(n => <option key={n} value={n}>{n} 時間前</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>OBC 締切（時間前）</span>
              <select value={form.obc} onChange={e => setForm(p => ({...p, obc: Number(e.target.value)}))}
                style={{ ...IS, width: '100px' }}>
                {[1,2,3,4,5,6,8].map(n => <option key={n} value={n}>{n} 時間前</option>)}
              </select>
            </label>
          </div>

          {/* Day checkboxes */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
              運航曜日（複数選択可）
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {DAY_JA.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)} style={{
                  width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 700,
                  background: form.days.includes(i) ? '#0ea5e9' : '#1e293b',
                  border:     `1px solid ${form.days.includes(i) ? '#0ea5e9' : '#334155'}`,
                  color:      form.days.includes(i) ? '#fff' : '#64748b',
                }}>{d}</button>
              ))}
            </div>
          </div>

          <button
            onClick={addFlight}
            disabled={!form.airline || !form.time || form.days.length === 0}
            style={{
              marginTop: '16px', background: '#0369a1', border: '1px solid #0ea5e9',
              borderRadius: '8px', color: '#7dd3fc', padding: '8px 24px',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              opacity: (!form.airline || !form.time || form.days.length === 0) ? 0.4 : 1,
            }}
          >
            追加 →
          </button>
        </div>
      )}

      {/* Notice */}
      <div style={{ fontSize: '11px', color: '#334155', marginBottom: '16px' }}>
        ※ 登録時刻は JST 基準。以下は参考スケジュールです — 実際の便は航空会社サイトでご確認ください。
      </div>

      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
        {data.map(f => {
          const nfoU = urgency(f.nfoMs);
          const obcU = urgency(f.obcMs);
          const depU = urgency(f.depMs);
          const done = f.depMs <= 0;
          const urgent = f.nfoMs > 0 && f.nfoMs < 3600000;

          return (
            <div key={f.id} style={{
              background: '#0f172a',
              border: `1px solid ${done ? '#1e293b' : urgent ? '#ef444455' : '#1e3a5f'}`,
              borderRadius: '14px', padding: '20px',
              opacity: done ? 0.55 : 1,
              position: 'relative', overflow: 'hidden',
            }}>
              {urgent && !done && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
              )}

              {/* Top: flight name + route */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#f1f5f9' }}>{f.airline}</span>
                  <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '10px' }}>{f.route}</span>
                </div>
                {!f.isPreset && (
                  <button
                    onClick={() => setFlights(p => p.filter(x => x.id !== f.id))}
                    style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
                  >×</button>
                )}
              </div>

              {/* Days of week */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
                {DAY_JA.map((d, i) => {
                  const active  = f.days.includes(i);
                  const isToday = i === todayDow;
                  return (
                    <div key={i} style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700,
                      background: active ? (isToday ? '#0ea5e9' : '#0c2240') : 'transparent',
                      border:     `1px solid ${active ? (isToday ? '#0ea5e9' : '#1e4080') : '#1e293b'}`,
                      color:      active ? (isToday ? '#fff' : '#7dd3fc') : '#2d3748',
                    }}>{d}</div>
                  );
                })}
              </div>

              {/* Next departure */}
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                次回 →{' '}
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>{fmtDT(f.dep)}</span>
              </div>

              {/* Three countdown rows */}
              {[
                { icon: '✂️', label: 'NFO 締切', dt: f.nfoCut, ms: f.nfoMs, u: nfoU, note: `起飞前 ${f.nfo}h` },
                { icon: '🧳', label: 'OBC 締切', dt: f.obcCut, ms: f.obcMs, u: obcU, note: `起飞前 ${f.obc}h` },
                { icon: '✈️', label: '出　発',   dt: f.dep,    ms: f.depMs, u: depU, note: f.time },
              ].map(({ icon, label, dt, ms, u, note }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: u.bg, border: `1px solid ${u.c}22`,
                  borderRadius: '8px', padding: '9px 12px', marginBottom: '6px',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                      {icon} {label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      {String(dt.getHours()).padStart(2,'0')}:{String(dt.getMinutes()).padStart(2,'0')} · {note}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: u.c, fontFamily: 'monospace' }}>
                      {fmtCountdown(ms)}
                    </div>
                    {u.warn && (
                      <div style={{ fontSize: '10px', color: u.c, marginTop: '2px' }}>{u.warn}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Live dot */}
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
        <span style={{ fontSize: '11px', color: '#334155' }}>
          毎秒更新 · {now.toLocaleDateString('zh-CN')} {now.toLocaleTimeString('zh-CN')}
        </span>
      </div>
    </div>
  );
}
