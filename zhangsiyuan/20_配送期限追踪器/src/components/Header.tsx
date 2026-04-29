'use client'
import { LANGUAGES, UI } from '@/lib/translations'
import type { Lang } from '@/lib/types'

interface Props { lang: Lang; onLang: (l: Lang) => void }

export default function Header({ lang, onLang }: Props) {
  const t = UI[lang]
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">✈</div>
        <div>
          <div className="header-title">{t.title}</div>
          <div className="header-sub">{t.subtitle}</div>
        </div>
      </div>
      <div className="lang-switcher">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            className={`lang-btn${lang === l.code ? ' active' : ''}`}
            onClick={() => onLang(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </header>
  )
}
