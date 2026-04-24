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
    <header className="bg-[#0f2557] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-wide hover:opacity-80 transition">
          OPTEC EXPRESS
        </Link>
        <nav className="flex gap-6 text-sm font-medium">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`hover:text-blue-300 transition ${
                pathname === href ? 'text-blue-300 border-b border-blue-300 pb-0.5' : ''
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
