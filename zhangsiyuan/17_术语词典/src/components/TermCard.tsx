'use client'
import type { Term, Lang } from '@/lib/fuzzySearch'
import { getCategoryColor, UI } from '@/lib/translations'

interface Props {
  term: Term
  lang: Lang
  onClick: () => void
}

export default function TermCard({ term, lang, onClick }: Props) {
  const t = UI[lang]
  const color = getCategoryColor(term.category)
  const catLabel = t.categories[term.category] ?? term.category

  return (
    <div
      className="term-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {/* Top color accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2, background: color, borderRadius: '18px 18px 0 0',
      }} />

      <div className="card-top">
        <span className="card-abbr" style={{ color }}>
          {term.abbr}
        </span>
        <span
          className="cat-badge"
          style={{
            background: `${color}18`,
            color,
            border: `1px solid ${color}30`,
          }}
        >
          {catLabel}
        </span>
      </div>

      <div className="card-fullname">{term.fullName[lang]}</div>
      <div className="card-definition">{term.definition[lang]}</div>

      {term.meta?.legacy && (
        <span className="legacy-tag">{t.legacyBadge}</span>
      )}
    </div>
  )
}
