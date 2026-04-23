'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',         zh: '首页',     en: 'Home' },
  { href: '/services', zh: '服务',     en: 'Services' },
  { href: '/about',    zh: '公司概要', en: 'About' },
  { href: '/contact',  zh: '联系我们', en: 'Contact' },
];

export default function Header() {
  const path = usePathname();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '72px', padding: '0 6%',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(3, 11, 24, 0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(37, 99, 235, 0.15)',
    }}>
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
        }}>OP</div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '3px' }}>OPTEC</div>
          <div style={{ fontSize: '8px', color: 'var(--sky)', letterSpacing: '2px', textTransform: 'uppercase' }}>Express</div>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: '4px' }}>
        {NAV.map(({ href, zh, en }) => {
          const active = path === href;
          return (
            <Link key={href} href={href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 18px', borderRadius: '8px', textDecoration: 'none',
              background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
              borderBottom: active ? '2px solid var(--blue-2)' : '2px solid transparent',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--sky)' : 'var(--muted)', letterSpacing: '0.5px' }}>{zh}</span>
              <span style={{ fontSize: '9px', color: active ? 'rgba(96,165,250,0.6)' : 'rgba(203,213,225,0.25)', letterSpacing: '1px', textTransform: 'uppercase' }}>{en}</span>
            </Link>
          );
        })}
      </nav>

      <Link href="/contact" style={{
        padding: '9px 22px', background: 'var(--blue)', color: '#fff',
        borderRadius: '7px', fontSize: '12px', fontWeight: 700,
        letterSpacing: '1.5px', textDecoration: 'none', textTransform: 'uppercase',
      }}>
        询价 / Quote
      </Link>
    </header>
  );
}
