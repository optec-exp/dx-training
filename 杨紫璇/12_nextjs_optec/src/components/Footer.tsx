import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      background: '#030306', padding: '48px 6% 32px',
      borderTop: '1px solid rgba(201,169,110,0.08)',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
        gap: '48px', marginBottom: '40px',
      }}>
        <div>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 700,
            letterSpacing: '4px', color: '#fff', textTransform: 'uppercase', marginBottom: '12px',
          }}>Optec Express</div>
          <p style={{ fontSize: '12px', color: 'rgba(232,232,240,0.35)', lineHeight: '2', maxWidth: '280px' }}>
            专注于国际紧急货运物流，以时间证明价值。<br />
            〒105-0004 東京都港区新橋 2-10-5
          </p>
        </div>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>导航</div>
          {[['/', '首页'], ['/services', '服务介绍'], ['/about', '公司概要'], ['/contact', '联系我们']].map(([href, label]) => (
            <div key={href} style={{ marginBottom: '10px' }}>
              <Link href={href} style={{ fontSize: '12px', color: 'rgba(232,232,240,0.4)', textDecoration: 'none' }}>{label}</Link>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '16px' }}>联系</div>
          <div style={{ fontSize: '12px', color: 'rgba(232,232,240,0.4)', lineHeight: '2.2' }}>
            <div>TEL: 03-4500-7408</div>
            <div>紧急 24/7: 03-4500-1918</div>
            <div>info@optec-exp.com</div>
          </div>
        </div>
      </div>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>
          © 2026 OPTEC Express Co., Ltd. All rights reserved.
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(201,169,110,0.3)', letterSpacing: '2px' }}>
          2016 — 2026 · 10 Years
        </span>
      </div>
    </footer>
  );
}
