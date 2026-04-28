'use client'
import type { ChecklistItem as Item, ItemState, Lang } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/translations'
import { CATEGORIES } from '@/lib/data'
import ChecklistItem from './ChecklistItem'

interface Props {
  category: string
  items: Item[]
  states: Record<string, ItemState>
  lang: Lang
  today: Date
  onToggle: (id: string) => void
}

export default function ChecklistSection({ category, items, states, lang, today, onToggle }: Props) {
  const catLabel = CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]?.[lang] ?? category
  const catColor = CATEGORIES.find(c => c.id === category)?.color ?? '#4f8ef7'
  const doneCount = items.filter(i => states[i.id]?.checked).length

  return (
    <section className="checklist-section">
      <div className="section-header" style={{ '--cat-color': catColor } as React.CSSProperties}>
        <div className="section-title">
          <span className="section-dot" />
          {catLabel}
        </div>
        <span className="section-count">{doneCount} / {items.length}</span>
      </div>
      <div className="section-items">
        {items.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            state={states[item.id] ?? { checked: false, checkedAt: null }}
            lang={lang}
            today={today}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  )
}
