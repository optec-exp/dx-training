'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/',         label: '首页' },
  { href: '/services', label: '服务介绍' },
  { href: '/about',    label: '公司概要' },
  { href: '/contact',  label: '联系我们' },
];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="bg-[#0a1628] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="w-5 h-5 bg-[#c9a84c] rounded-sm"></div>
          <span className="text-sm font-bold tracking-widest">OPTEC EXPRESS</span>
        </Link>
        <nav className="flex gap-8 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition ${
                pathname === href
                  ? 'text-[#c9a84c] border-b border-[#c9a84c] pb-0.5'
                  : 'text-blue-200 hover:text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <Link
          href="/contact"
          className="border border-[#c9a84c] text-[#c9a84c] text-xs font-semibold px-5 py-2 hover:bg-[#c9a84c] hover:text-[#0a1628] transition"
        >
          立即咨询
        </Link>
      </div>
    </header>
  );
}
