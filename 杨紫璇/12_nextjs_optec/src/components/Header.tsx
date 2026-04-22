'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/',        label: '首页' },
  { href: '/services',label: '服务' },
  { href: '/about',   label: '公司概要' },
  { href: '/contact', label: '联系我们' },
];

export default function Header() {
  const path = usePathname();

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: '72px', padding: '0 6%',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(8,8,15,0.95)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(201,169,110,0.1)',
    }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{
            fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 700,
            letterSpacing: '4px', color: '#fff', textTransform: 'uppercase',
          }}>Optec Express</div>
          <div style={{ fontSize: '9px', letterSpacing: '3px', color: 'var(--gold)', textTransform: 'uppercase' }}>
            Global Urgent Logistics
          </div>
        </div>
      </Link>

      <nav style={{ display: 'flex', gap: '32px' }}>
        {NAV.map(({ href, label }) => (
          <Link key={href} href={href} style={{
            fontSize: '12px', letterSpacing: '1.5px', textDecoration: 'none',
            textTransform: 'uppercase',
            color: path === href ? 'var(--gold)' : 'rgba(232,232,240,0.5)',
            borderBottom: path === href ? '1px solid var(--gold)' : '1px solid transparent',
            paddingBottom: '2px',
            transition: 'color 0.2s',
          }}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
