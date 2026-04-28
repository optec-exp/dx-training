'use client'
import type { ChecklistItem as Item, ItemState, Lang } from '@/lib/types'
import { UI, URGENCY_LABELS, PRIORITY_LABELS } from '@/lib/translations'
import { calcUrgency } from '@/lib/urgency'
import { CATEGORIES } from '@/lib/data'

interface Props {
  item: Item
  state: ItemState
  lang: Lang
  today: Date
  onToggle: (id: string) => void
}

export default function ChecklistItem({ item, state, lang, today, onToggle }: Props) {
  const t = UI[lang]
  const urgency = calcUrgency(item.deadlineDay, state.checked, today)
  const catColor = CATEGORIES.find(c => c.id === item.category)?.color ?? '#4f8ef7'
  const urgencyLabel = URGENCY_LABELS[urgency][lang]
  const priorityLabel = PRIORITY_LABELS[lang][item.priority]

  const checkedDateStr = state.checkedAt
    ? state.checkedAt.slice(0, 10)
    : ''

  return (
    <div
      className={`checklist-item urgency-${urgency}`}
      style={{ '--cat-color': catColor } as React.CSSProperties}
      onClick={() => onToggle(item.id)}
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? onToggle(item.id) : null}
    >
      <div className="item-left">
        <div className={`checkbox${state.checked ? ' checked' : ''}`}>
          {state.checked && <span className="checkmark">✓</span>}
        </div>
      </div>

      <div className="item-body">
        <div className="item-top">
          <span className={`item-label${state.checked ? ' done' : ''}`}>
            {item.label[lang]}
          </span>
          <div className="item-badges">
            {urgency !== 'normal' && urgency !== 'done' && (
              <span className={`urgency-badge urgency-${urgency}`}>{urgencyLabel}</span>
            )}
            <span className={`priority-badge priority-${item.priority}`}>{priorityLabel}</span>
          </div>
        </div>

        <div className="item-note">{item.note[lang]}</div>

        <div className="item-footer">
          <span className="deadline-label">{t.deadlineLabel(item.deadlineDay)}</span>
          {state.checked && checkedDateStr && (
            <span className="checked-at">{t.checkedAt(checkedDateStr)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
