'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import translations from '@/data/translations'

export default function Nav() {
  const pathname = usePathname()
  const { lang, setLang } = useLanguage()
  const t = translations[lang].nav
  const ll = translations[lang].langLabel

  const NAV_LINKS = [
    { href: '/',         label: t.home },
    { href: '/about',    label: t.about },
    { href: '/services', label: t.services },
    { href: '/contact',  label: t.contact },
  ]

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo">OPTEC <em>EXPRESS</em></Link>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={pathname === link.href ? 'active' : ''}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="lang-switcher">
        {(['ja', 'zh', 'en'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`lang-btn${lang === l ? ' active' : ''}`}
          >
            {ll[l]}
          </button>
        ))}
      </div>
    </nav>
  )
}
