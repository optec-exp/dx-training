'use client'
// 标签UI示例：usePathname() 判断当前路由，高亮对应标签
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import translations, { type Lang } from '@/data/translations'

export default function Nav() {
  const { lang, setLang } = useLang()
  const t = translations[lang]
  const path = usePathname()

  const tabs = [
    { href: '/',           label: t.nav.home },
    { href: '/cryowing',   label: t.nav.cryowing },
    { href: '/thermosure', label: t.nav.thermosure },
    { href: '/cellpass',   label: t.nav.cellpass },
  ]

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="nav-logo">
          <span className="logo-cell">Cell</span><span className="logo-chain">Chain</span>
          <span className="logo-sub">Logistics</span>
        </Link>
        <div className="nav-tabs">
          {tabs.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`nav-tab${path === tab.href ? ' active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        <div className="lang-sw">
          {(['ja', 'zh', 'en'] as Lang[]).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`ls-btn${lang === l ? ' active' : ''}`}
            >
              {t.lang_label[l]}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
