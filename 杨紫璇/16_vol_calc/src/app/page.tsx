'use client';
import { useState } from 'react';

const DIVISOR = 6000; // IATA standard volumetric divisor

export default function Home() {
  const [l, setL] = useState('');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [actual, setActual] = useState('');

  // Real-time calculation — runs on every onChange
  const lN = parseFloat(l) || 0;
  const wN = parseFloat(w) || 0;
  const hN = parseFloat(h) || 0;
  const actualN = parseFloat(actual) || 0;

  const volWeight = lN > 0 && wN > 0 && hN > 0
    ? parseFloat(((lN * wN * hN) / DIVISOR).toFixed(2))
    : null;

  const hasActual = actualN > 0;
  const hasVol    = volWeight !== null;
  const hasResult = hasVol && hasActual;

  const chargeableWeight = hasResult ? Math.max(volWeight!, actualN) : null;
  const volIsHigher      = hasResult ? volWeight! >= actualN : false;

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--dark-3)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
    padding: '14px 16px', color: '#fff', fontSize: '16px', textAlign: 'right' as const,
  };

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', background: 'rgba(8,8,15,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px' }}>OPTEC</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>EXPRESS</span>
        </div>
        <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>Volumetric Weight Calculator</span>
      </header>

      {/* Hero */}
      <section style={{ padding: '120px 6% 48px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(201,169,110,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase' }}>📦 Volume Weight Tool</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px,5vw,56px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: '16px' }}>
            体积重量计算工具
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: 2 }}>
            输入货物三边尺寸与实际重量，实时对比体积重量与实际重量。<br />
            较大值即为航空运输的<strong style={{ color: '#e8e8f0' }}>计费重量</strong>。
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section style={{ padding: '56px 6%' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'start' }}>

          {/* Input Panel */}
          <div style={{ background: 'var(--dark-3)', borderRadius: '16px', padding: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '32px' }}>输入货物信息</h2>

            {/* Dimensions */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '14px' }}>
                三边尺寸（cm）
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                  { val: l, set: setL, placeholder: '长', label: 'L' },
                  { val: w, set: setW, placeholder: '宽', label: 'W' },
                  { val: h, set: setH, placeholder: '高', label: 'H' },
                ].map(({ val, set, placeholder, label }) => (
                  <div key={label}>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', textAlign: 'center', marginBottom: '6px' }}>{label}</div>
                    <input
                      type="number" min="0" step="0.1"
                      placeholder={placeholder}
                      value={val}
                      onChange={e => set(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Actual Weight */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '8px' }}>
                实际重量（kg）
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0" step="0.1"
                  placeholder="0.0"
                  value={actual}
                  onChange={e => setActual(e.target.value)}
                  style={inputStyle}
                />
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--muted)' }}>kg</span>
              </div>
            </div>

            {/* Formula Box */}
            <div style={{ background: 'var(--dark-4)', borderRadius: '10px', padding: '16px 20px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '8px' }}>计算公式</div>
              <div style={{ fontSize: '13px', color: '#e8e8f0', fontFamily: 'monospace', lineHeight: 2 }}>
                体积重量 = 长 × 宽 × 高 ÷ {DIVISOR}
              </div>
              {hasVol && (
                <div style={{ fontSize: '12px', color: 'var(--gold)', marginTop: '6px', fontFamily: 'monospace' }}>
                  = {lN} × {wN} × {hN} ÷ {DIVISOR} = <strong>{volWeight} kg</strong>
                </div>
              )}
            </div>
          </div>

          {/* Result Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Volumetric Weight Card */}
            <div style={{
              background: hasVol && volIsHigher ? 'linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.05))' : 'var(--dark-3)',
              borderRadius: '14px', padding: '28px',
              border: `1px solid ${hasVol && volIsHigher ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}>
              {hasVol && volIsHigher && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: '#08080f', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', padding: '3px 10px', borderRadius: '10px' }}>
                  計費基準
                </div>
              )}
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: hasVol && volIsHigher ? 'var(--gold)' : 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                📦 体积重量
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 700, color: hasVol && volIsHigher ? 'var(--gold)' : '#e8e8f0', lineHeight: 1, marginBottom: '6px' }}>
                {hasVol ? `${volWeight}` : '—'}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{hasVol ? 'kg' : '请输入三边尺寸'}</div>
            </div>

            {/* Actual Weight Card */}
            <div style={{
              background: hasActual && !volIsHigher && hasResult ? 'linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.05))' : 'var(--dark-3)',
              borderRadius: '14px', padding: '28px',
              border: `1px solid ${hasActual && !volIsHigher && hasResult ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}>
              {hasActual && !volIsHigher && hasResult && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--gold)', color: '#08080f', fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', padding: '3px 10px', borderRadius: '10px' }}>
                  計費基準
                </div>
              )}
              <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: hasActual && !volIsHigher && hasResult ? 'var(--gold)' : 'var(--muted)', textTransform: 'uppercase', marginBottom: '12px' }}>
                ⚖ 实际重量
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 700, color: hasActual && !volIsHigher && hasResult ? 'var(--gold)' : '#e8e8f0', lineHeight: 1, marginBottom: '6px' }}>
                {hasActual ? `${actualN}` : '—'}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--muted)' }}>{hasActual ? 'kg' : '请输入实际重量'}</div>
            </div>

            {/* Chargeable Weight Summary */}
            {hasResult && (
              <div style={{ background: 'var(--dark-3)', borderRadius: '14px', padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)', animation: 'fadeIn 0.3s ease' }}>
                <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
                <div style={{ fontSize: '11px', letterSpacing: '1.5px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '16px' }}>计费重量判定</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>计费基准</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0' }}>{volIsHigher ? '体积重量' : '实际重量'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>计费重量</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: 'var(--gold)' }}>{chargeableWeight} kg</span>
                </div>
              </div>
            )}

            {/* Tip */}
            {!hasResult && (
              <div style={{ background: 'var(--dark-3)', borderRadius: '14px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📐</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 2 }}>
                  输入货物的长、宽、高（cm）<br />
                  和实际重量（kg），结果将实时更新
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Info Bar */}
      <section style={{ padding: '0 6% 64px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', background: 'var(--dark-2)', borderRadius: '14px', padding: '28px 32px', border: '1px solid rgba(255,255,255,0.04)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '24px' }}>
          {[
            { icon: '÷', title: '÷6000 标准', desc: 'IATA 国际航协通用计算标准' },
            { icon: '⚖', title: '取较大值', desc: '体积重量与实际重量，取大者为计费重量' },
            { icon: '✈', title: '适用范围', desc: '适用于 OPTEC Express 所有航空货运服务' },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{title}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.8 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '28px 6%', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px', marginBottom: '6px' }}>OPTEC EXPRESS</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Global Urgent Logistics Since 2016</div>
      </footer>
    </div>
  );
}
