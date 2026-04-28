'use client'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import type { Airport, Lang } from '@/lib/types'
import { UI } from '@/lib/translations'
import { COUNTRY_NAMES } from '@/lib/countries'

const AirportMap = dynamic(() => import('./AirportMap'), { ssr: false, loading: () => <div className="map-loading">…</div> })

interface Props {
  airport: Airport
  lang: Lang
  onClose: () => void
}

export default function AirportModal({ airport: a, lang, onClose }: Props) {
  const t = UI[lang]
  const countryInfo = COUNTRY_NAMES[a.country]
  const countryName = countryInfo ? countryInfo[lang] : a.country

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-codes">
            <span className="iata-badge large">{a.iata}</span>
            <span className="icao-badge large">{a.icao}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label={t.closeMap}>✕</button>
        </div>

        <div className="modal-name">{a.name}</div>

        <div className="modal-meta">
          <div className="meta-row">
            <span className="meta-label">{t.city}</span>
            <span className="meta-value">{a.city}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">{t.country}</span>
            <span className="meta-value">{countryName}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">{t.elevation}</span>
            <span className="meta-value">{a.elev.toLocaleString()} {t.elevUnit}</span>
          </div>
          <div className="meta-row">
            <span className="meta-label">{t.coordinates}</span>
            <span className="meta-value">{a.lat.toFixed(4)}°, {a.lon.toFixed(4)}°</span>
          </div>
        </div>

        <div className="modal-map-section">
          <div className="modal-map-title">{t.mapTitle}</div>
          <AirportMap airport={a} />
        </div>
      </div>
    </div>
  )
}
