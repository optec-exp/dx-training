'use client'
import { useState, useMemo, useCallback } from 'react'
import Header from '@/components/Header'
import ProgressBar from '@/components/ProgressBar'
import ChecklistSection from '@/components/ChecklistSection'
import type { ItemState, Lang } from '@/lib/types'
import { UI } from '@/lib/translations'
import { CHECKLIST, CATEGORIES } from '@/lib/data'
import { calcUrgency, URGENCY_ORDER } from '@/lib/urgency'

type Filter = 'all' | 'pending' | 'done'

const TODAY = new Date()

function buildInitialStates(): Record<string, ItemState> {
  return Object.fromEntries(
    CHECKLIST.map(item => [item.id, { checked: false, checkedAt: null }])
  )
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [states, setStates] = useState<Record<string, ItemState>>(buildInitialStates)
  const [filter, setFilter] = useState<Filter>('all')

  const t = UI[lang]

  const toggle = useCallback((id: string) => {
    setStates(prev => {
      const current = prev[id]
      const nowChecked = !current.checked
      return {
        ...prev,
        [id]: {
          checked: nowChecked,
          checkedAt: nowChecked ? new Date().toISOString() : null,
        },
      }
    })
  }, [])

  const reset = useCallback(() => {
    if (window.confirm(t.resetConfirm)) {
      setStates(buildInitialStates())
    }
  }, [t.resetConfirm])

  const doneCount = useMemo(
    () => CHECKLIST.filter(i => states[i.id]?.checked).length,
    [states]
  )

  // Group by category, respecting filter, sorted by urgency within each group
  const groupedItems = useMemo(() => {
    return CATEGORIES.map(cat => {
      let items = CHECKLIST.filter(i => i.category === cat.id)

      if (filter === 'pending') items = items.filter(i => !states[i.id]?.checked)
      if (filter === 'done')    items = items.filter(i =>  states[i.id]?.checked)

      // sort by urgency then deadline
      items = [...items].sort((a, b) => {
        const ua = URGENCY_ORDER[calcUrgency(a.deadlineDay, states[a.id]?.checked ?? false, TODAY)]
        const ub = URGENCY_ORDER[calcUrgency(b.deadlineDay, states[b.id]?.checked ?? false, TODAY)]
        if (ua !== ub) return ua - ub
        return a.deadlineDay - b.deadlineDay
      })

      return { catId: cat.id, items }
    }).filter(g => g.items.length > 0)
  }, [states, filter])

  return (
    <div className="page-wrapper">
      <Header
        lang={lang}
        onLang={setLang}
        year={TODAY.getFullYear()}
        month={TODAY.getMonth() + 1}
      />

      <main className="main-content">
        <div className="page-head">
          <h1 className="page-title">{t.title}</h1>
          <p className="page-subtitle">{t.subtitle}</p>
        </div>

        <ProgressBar
          done={doneCount}
          total={CHECKLIST.length}
          lang={lang}
          onReset={reset}
        />

        <div className="filter-bar">
          {(['all', 'pending', 'done'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t.filterAll : f === 'pending' ? t.filterPending : t.filterDone}
            </button>
          ))}
        </div>

        {groupedItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">{t.noItems}</div>
          </div>
        ) : (
          <div className="checklist-layout">
            {groupedItems.map(g => (
              <ChecklistSection
                key={g.catId}
                category={g.catId}
                items={g.items}
                states={states}
                lang={lang}
                today={TODAY}
                onToggle={toggle}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
