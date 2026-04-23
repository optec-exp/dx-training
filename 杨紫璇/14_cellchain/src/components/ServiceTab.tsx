'use client';

interface Feature {
  icon: string;
  text: string;
}

interface Stat {
  num: string;
  label: string;
}

export interface ServiceData {
  id: string;
  label: string;
  accentColor: string;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  features: Feature[];
  stats: Stat[];
  badge: string;
}

interface ServiceTabProps {
  service: ServiceData;
}

export default function ServiceTab({ service }: ServiceTabProps) {
  const { accentColor, tag, title, subtitle, desc, features, stats, badge } = service;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', marginBottom: '64px' }}>
        {/* Left: Text */}
        <div>
          <div style={{ display: 'inline-block', fontSize: '10px', letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', background: `${accentColor}18`, border: `1px solid ${accentColor}40`, borderRadius: '20px', padding: '5px 14px', marginBottom: '24px' }}>
            {tag}
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(32px,4vw,52px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: '16px' }}>{title}</h2>
          <div style={{ fontSize: '13px', letterSpacing: '2px', color: accentColor, marginBottom: '20px', fontWeight: 500 }}>{subtitle}</div>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.1, marginBottom: '32px' }}>{desc}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#d8e8ff' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: `${accentColor}20`, border: `1px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Visual card */}
        <div style={{ background: 'var(--dark-3)', borderRadius: '20px', padding: '48px 40px', border: `1px solid ${accentColor}25`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)` }} />
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>{features[0]?.icon}</div>
          <div style={{ fontSize: '11px', letterSpacing: '3px', color: accentColor, textTransform: 'uppercase', marginBottom: '12px' }}>{badge}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '32px' }}>
            {stats.map(({ num, label }) => (
              <div key={label} style={{ background: 'var(--dark-4)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center', border: `1px solid ${accentColor}18` }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: accentColor, lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--muted)', marginTop: '6px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
