'use client';
import { ServiceData } from '@/data/services';

interface Props {
  service: ServiceData;
}

export default function ServiceTab({ service }: Props) {
  const { accent, tag, title, tempRange, desc, features, stats } = service;

  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px', alignItems: 'center' }}>

        {/* Left: text content */}
        <div>
          <div style={{
            display: 'inline-block', fontSize: '10px', letterSpacing: '3px',
            color: accent, textTransform: 'uppercase',
            background: `${accent}15`, border: `1px solid ${accent}40`,
            borderRadius: '20px', padding: '5px 14px', marginBottom: '24px',
          }}>
            {tag}
          </div>

          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(30px, 3.5vw, 48px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: '14px', whiteSpace: 'pre-line' }}>
            {title}
          </h2>

          <div style={{ fontSize: '12px', letterSpacing: '1.5px', color: accent, marginBottom: '20px', fontWeight: 500 }}>
            {tempRange}
          </div>

          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.1, marginBottom: '32px' }}>
            {desc}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text)' }}>
                <span style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: `${accent}18`, border: `1px solid ${accent}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
                }}>
                  {icon}
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: visual stats card */}
        <div style={{
          background: 'var(--bg-3)', borderRadius: '20px', padding: '44px 36px',
          border: `1px solid ${accent}20`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)` }} />

          <div style={{ fontSize: '10px', letterSpacing: '3px', color: accent, textTransform: 'uppercase', marginBottom: '12px' }}>{tag}</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '8px', whiteSpace: 'pre-line' }}>{title}</div>
          <div style={{ fontSize: '11px', color: `${accent}aa`, marginBottom: '32px' }}>{tempRange}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {stats.map(({ num, label }) => (
              <div key={label} style={{
                background: 'var(--bg-4)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center',
                border: `1px solid ${accent}18`,
              }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: accent, lineHeight: 1, marginBottom: '6px' }}>{num}</div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
