'use client'
import { CATEGORIES, getCategoryColor, UI } from '@/lib/translations'
import type { Lang } from '@/lib/fuzzySearch'

interface Props {
  selected: string
  lang: Lang
  counts: Record<string, number>
  onSelect: (id: string) => void
}

export default function CategoryFilter({ selected, lang, counts, onSelect }: Props) {
  const t = UI[lang]
  return (
    <div className="category-scroll">
      {CATEGORIES.map(cat => {
        const color = getCategoryColor(cat.id)
        const label = t.categories[cat.id] ?? cat.id
        const count = cat.id === 'all' ? counts.__total__ : (counts[cat.id] ?? 0)
        const isActive = selected === cat.id
        return (
          <button
            key={cat.id}
            className={`cat-btn${isActive ? ' active' : ''}`}
            style={isActive ? { background: color, borderColor: color } : {}}
            onClick={() => onSelect(cat.id)}
          >
            {label}
            {count > 0 && (
              <span style={{
                marginLeft: 5,
                opacity: 0.7,
                fontSize: 10,
              }}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
