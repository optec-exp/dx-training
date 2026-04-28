'use client'
import type { Airport, Lang } from '@/lib/types'
import { UI } from '@/lib/translations'
import { COUNTRY_NAMES } from '@/lib/countries'

interface Props {
  airport: Airport
  lang: Lang
  onSelect: (a: Airport) => void
}

export default function AirportCard({ airport: a, lang, onSelect }: Props) {
  const t = UI[lang]
  const countryInfo = COUNTRY_NAMES[a.country]
  const countryName = countryInfo ? countryInfo[lang] : a.country

  return (
    <div className={`airport-card type-${a.type}`} onClick={() => onSelect(a)} tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(a)}>
      <div className="card-top">
        <div className="card-codes">
          <span className="iata-badge">{a.iata}</span>
          <span className="icao-badge">{a.icao}</span>
        </div>
        <span className={`type-badge type-${a.type}`}>{t.typeLabel[a.type]}</span>
      </div>
      <div className="card-name">{a.name}</div>
      <div className="card-location">
        <span className="loc-city">{a.city}</span>
        <span className="loc-sep">·</span>
        <span className="loc-country">{countryName}</span>
      </div>
      <div className="card-footer">
        <span className="coord-text">{a.lat.toFixed(4)}°, {a.lon.toFixed(4)}°</span>
        <button className="map-btn" onClick={e => { e.stopPropagation(); onSelect(a) }}>
          {t.openMap} →
        </button>
      </div>
    </div>
  )
}
