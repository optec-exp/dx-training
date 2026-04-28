'use client'
import { LANGUAGES, UI } from '@/lib/translations'
import type { Lang } from '@/lib/fuzzySearch'

interface Props {
  lang: Lang
  onLangChange: (l: Lang) => void
}

export default function Header({ lang, onLangChange }: Props) {
  const t = UI[lang]
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">✈</div>
        <div>
          <div className="header-logo-text">OPTEC</div>
          <div className="header-logo-sub">Air Cargo Glossary</div>
        </div>
      </div>

      <div className="lang-switcher">
        {LANGUAGES.map(l => (
          <button
            key={l.code}
            className={`lang-btn${lang === l.code ? ' active' : ''}`}
            onClick={() => onLangChange(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </header>
  )
}
