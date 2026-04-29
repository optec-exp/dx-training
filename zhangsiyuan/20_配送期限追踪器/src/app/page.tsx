'use client'
import { useState, useMemo, useCallback } from 'react'
import Header from '@/components/Header'
import ProgressSummary from '@/components/ProgressSummary'
import ShipmentCard from '@/components/ShipmentCard'
import type { ShipmentState, Lang } from '@/lib/types'
import { UI } from '@/lib/translations'
import { SHIPMENTS } from '@/lib/data'
import { calcEtaUrgency, ETA_URGENCY_ORDER } from '@/lib/urgency'

type Filter = 'all' | 'active' | 'overdue' | 'done'

const TODAY = new Date()

function initStates(): Record<string, ShipmentState> {
  return Object.fromEntries(
    SHIPMENTS.map(s => [s.id, { departed: false, arrived: false, departedAt: null, arrivedAt: null }])
  )
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [states, setStates] = useState<Record<string, ShipmentState>>(initStates)
  const [filter, setFilter] = useState<Filter>('all')

  const t = UI[lang]

  const toggleDeparted = useCallback((id: string) => {
    setStates(prev => {
      const cur = prev[id]
      const now = new Date().toISOString()
      const newDep = !cur.departed
      return {
        ...prev,
        [id]: {
          ...cur,
          departed: newDep,
          departedAt: newDep ? now : null,
          // 出発を取り消すと到着もリセット
          arrived: newDep ? cur.arrived : false,
          arrivedAt: newDep ? cur.arrivedAt : null,
        },
      }
    })
  }, [])

  const toggleArrived = useCallback((id: string) => {
    setStates(prev => {
      const cur = prev[id]
      const now = new Date().toISOString()
      const newArr = !cur.arrived
      return {
        ...prev,
        [id]: {
          ...cur,
          arrived: newArr,
          arrivedAt: newArr ? now : null,
          // 到着確認すると自動的に出発済にもなる
          departed: newArr ? true : cur.departed,
          departedAt: newArr && !cur.departed ? now : cur.departedAt,
        },
      }
    })
  }, [])

  const reset = useCallback(() => {
    if (window.confirm(t.resetConfirm)) setStates(initStates())
  }, [t.resetConfirm])

  const { arrivedCount, departedCount, overdueCount } = useMemo(() => {
    let arr = 0, dep = 0, ovd = 0
    for (const s of SHIPMENTS) {
      const st = states[s.id]
      if (st.arrived)  arr++
      if (st.departed) dep++
      const urg = calcEtaUrgency(s.eta, st.arrived, TODAY)
      if (urg === 'overdue') ovd++
    }
    return { arrivedCount: arr, departedCount: dep, overdueCount: ovd }
  }, [states])

  const displayShipments = useMemo(() => {
    let list = SHIPMENTS.filter(s => {
      const st = states[s.id]
      const urg = calcEtaUrgency(s.eta, st.arrived, TODAY)
      if (filter === 'active')  return !st.arrived && urg !== 'overdue'
      if (filter === 'overdue') return urg === 'overdue'
      if (filter === 'done')    return st.arrived
      return true
    })
    // 緊急度でソート
    list = [...list].sort((a, b) => {
      const ua = ETA_URGENCY_ORDER[calcEtaUrgency(a.eta, states[a.id].arrived, TODAY)]
      const ub = ETA_URGENCY_ORDER[calcEtaUrgency(b.eta, states[b.id].arrived, TODAY)]
      if (ua !== ub) return ua - ub
      return a.eta.localeCompare(b.eta)
    })
    return list
  }, [states, filter])

  return (
    <div className="page-wrapper">
      <Header lang={lang} onLang={setLang} />

      <main className="main-content">
        <ProgressSummary
          total={SHIPMENTS.length}
          departedCount={departedCount}
          arrivedCount={arrivedCount}
          overdueCount={overdueCount}
          lang={lang}
          onReset={reset}
        />

        <div className="filter-bar">
          {(['all', 'active', 'overdue', 'done'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}${f === 'overdue' && overdueCount > 0 ? ' has-alert' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t.filterAll
                : f === 'active' ? t.filterActive
                : f === 'overdue' ? `${t.filterOverdue}${overdueCount > 0 ? ` (${overdueCount})` : ''}`
                : t.filterDone}
            </button>
          ))}
        </div>

        {displayShipments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">{t.noShipments}</div>
          </div>
        ) : (
          <div className="shipment-grid">
            {displayShipments.map(s => (
              <ShipmentCard
                key={s.id}
                shipment={s}
                state={states[s.id]}
                lang={lang}
                today={TODAY}
                onToggleDeparted={toggleDeparted}
                onToggleArrived={toggleArrived}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
