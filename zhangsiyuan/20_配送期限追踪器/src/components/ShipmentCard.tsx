'use client'
import type { Shipment, ShipmentState, Lang } from '@/lib/types'
import { UI, ETA_URGENCY_LABEL, ETD_STATUS_LABEL, PRIORITY_LABEL } from '@/lib/translations'
import { calcEtaUrgency, calcEtdStatus, diffDays } from '@/lib/urgency'

interface Props {
  shipment: Shipment
  state: ShipmentState
  lang: Lang
  today: Date
  onToggleDeparted: (id: string) => void
  onToggleArrived: (id: string) => void
}

export default function ShipmentCard({
  shipment: s, state, lang, today, onToggleDeparted, onToggleArrived,
}: Props) {
  const t = UI[lang]
  const etaUrgency = calcEtaUrgency(s.eta, state.arrived, today)
  const etdStatus  = calcEtdStatus(s.etd, state.departed, today)
  const etaDiff    = diffDays(s.eta, today)
  const etdDiff    = diffDays(s.etd, today)
  const etaLabel   = ETA_URGENCY_LABEL[etaUrgency][lang]
  const etdLabel   = ETD_STATUS_LABEL[etdStatus][lang]
  const prioLabel  = PRIORITY_LABEL[s.priority][lang]

  return (
    <div className={`shipment-card eta-${etaUrgency} etd-${etdStatus}`}>
      {/* Top row */}
      <div className="card-top">
        <div className="card-ids">
          <span className="awb-badge">{s.awb}</span>
          <span className={`prio-badge prio-${s.priority}`}>{prioLabel}</span>
        </div>
        <div className="card-badges">
          {etaUrgency !== 'normal' && (
            <span className={`urgency-badge eta-badge-${etaUrgency}`}>{etaLabel}</span>
          )}
          {etdStatus === 'delayed' && (
            <span className="urgency-badge etd-badge-delayed">{etdLabel}</span>
          )}
          {etdStatus === 'departing' && (
            <span className="urgency-badge etd-badge-departing">{etdLabel}</span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="card-route">
        <span className="route-origin">{s.origin}</span>
        <span className="route-arrow">→</span>
        <span className="route-dest">{s.destination}</span>
      </div>

      {/* Cargo + weight */}
      <div className="card-cargo">
        <span className="cargo-label">{s.cargo[lang]}</span>
        <span className="cargo-weight">{s.weightKg.toLocaleString()} {t.kg}</span>
      </div>

      {/* ETD / ETA timeline */}
      <div className="card-timeline">
        <div className={`timeline-item etd-${etdStatus}`}>
          <div className="tl-header">
            <span className="tl-type">{t.etd}</span>
            <span className={`tl-days etd-${etdStatus}`}>{t.daysToEtd(etdDiff)}</span>
          </div>
          <div className="tl-date">{s.etd}</div>
          {state.departed && state.departedAt && (
            <div className="tl-confirmed">{t.departedAt(state.departedAt.slice(0, 10))}</div>
          )}
        </div>
        <div className="tl-connector">
          <div className={`tl-line${state.departed ? ' active' : ''}`} />
          <span className="tl-plane">{state.departed ? '✈' : '·'}</span>
        </div>
        <div className={`timeline-item eta-${etaUrgency}`}>
          <div className="tl-header">
            <span className="tl-type">{t.eta}</span>
            <span className={`tl-days eta-${etaUrgency}`}>{t.daysLeft(etaDiff)}</span>
          </div>
          <div className="tl-date">{s.eta}</div>
          {state.arrived && state.arrivedAt && (
            <div className="tl-confirmed">{t.arrivedAt(state.arrivedAt.slice(0, 10))}</div>
          )}
        </div>
      </div>

      {/* Checkboxes */}
      <div className="card-checks">
        <button
          className={`check-btn${state.departed ? ' checked' : ''}`}
          onClick={() => onToggleDeparted(s.id)}
        >
          <span className={`check-box${state.departed ? ' checked' : ''}`}>
            {state.departed && '✓'}
          </span>
          <span className="check-label">{t.departed}</span>
        </button>
        <button
          className={`check-btn${state.arrived ? ' checked' : ''}`}
          onClick={() => onToggleArrived(s.id)}
        >
          <span className={`check-box${state.arrived ? ' checked' : ''}`}>
            {state.arrived && '✓'}
          </span>
          <span className="check-label">{t.arrived}</span>
        </button>
      </div>
    </div>
  )
}
