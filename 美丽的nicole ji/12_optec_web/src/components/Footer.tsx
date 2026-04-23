import Link from 'next/link';

const LINKS = [
  { href: '/',         zh: '首页',     en: 'Home' },
  { href: '/services', zh: '服务介绍', en: 'Services' },
  { href: '/about',    zh: '公司概要', en: 'About' },
  { href: '/contact',  zh: '联系我们', en: 'Contact' },
];

export default function Footer() {
  return (
    <footer style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(37,99,235,0.1)', padding: '56px 6% 32px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '48px', paddingBottom: '40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: 'linear-gradient(135deg, #2563eb, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#fff' }}>OP</div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#fff', letterSpacing: '3px' }}>OPTEC EXPRESS</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 2, maxWidth: '280px' }}>
              国际紧急物流专家，覆盖全球186城市。<br />
              AOG・医药品・精密仪器，每分钟都是承诺。
            </p>
            <div style={{ marginTop: '20px', fontSize: '11px', color: 'rgba(96,165,250,0.5)', letterSpacing: '1px' }}>
              Global Urgent Logistics Since 2016
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--sky)', textTransform: 'uppercase', marginBottom: '20px' }}>导航 / Nav</div>
            {LINKS.map(({ href, zh, en }) => (
              <div key={href} style={{ marginBottom: '12px' }}>
                <Link href={href} style={{ textDecoration: 'none', display: 'flex', gap: '6px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '13px', color: 'rgba(203,213,225,0.55)' }}>{zh}</span>
                  <span style={{ fontSize: '10px', color: 'rgba(203,213,225,0.25)', letterSpacing: '1px' }}>{en}</span>
                </Link>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '10px', letterSpacing: '3px', color: 'var(--sky)', textTransform: 'uppercase', marginBottom: '20px' }}>联系 / Contact</div>
            <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 2.4 }}>
              <div>📍 東京都港区新橋 2-10-5</div>
              <div>📞 03-4500-7408</div>
              <div style={{ color: 'rgba(248,113,113,0.7)' }}>🚨 03-4500-1918 <span style={{ fontSize: '10px' }}>（24/7紧急）</span></div>
              <div>✉️ info@optec-exp.com</div>
            </div>
          </div>

        </div>
        <div style={{ paddingTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(203,213,225,0.2)' }}>
          <span>© 2026 OPTEC Express Co., Ltd. All rights reserved.</span>
          <span style={{ color: 'rgba(96,165,250,0.3)', letterSpacing: '2px' }}>2016 — 2026 · 10 YEARS</span>
        </div>
      </div>
    </footer>
  );
}
