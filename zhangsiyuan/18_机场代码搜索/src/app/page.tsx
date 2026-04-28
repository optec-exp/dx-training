'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import AirportCard from '@/components/AirportCard'
import AirportModal from '@/components/AirportModal'
import type { Airport, Lang } from '@/lib/types'
import { UI } from '@/lib/translations'
import { searchAirports } from '@/lib/search'
import rawAirports from '@/data/airports.json'

const ALL_AIRPORTS = rawAirports as Airport[]

type Filter = 'all' | 'large' | 'medium'

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<Airport | null>(null)

  const t = UI[lang]

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(timer)
  }, [query])

  const filtered = useMemo(() => {
    let base = ALL_AIRPORTS
    if (filter !== 'all') base = base.filter(a => a.type === filter)
    if (debouncedQuery.trim()) return searchAirports(base, debouncedQuery)
    return base
  }, [debouncedQuery, filter])

  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <div className="page-wrapper">
      <Header lang={lang} onLang={setLang} />

      <main className="main-content">
        <div className="page-head">
          <h1 className="page-title">{t.title}</h1>
          <p className="page-subtitle">{t.subtitle}</p>
        </div>

        <div className="search-section">
          <SearchBar query={query} lang={lang} onChange={setQuery} />
        </div>

        <div className="filter-bar">
          {(['all', 'large', 'medium'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? t.filterAll : f === 'large' ? t.filterLarge : t.filterMedium}
            </button>
          ))}
          <span className="results-count">{t.results(filtered.length)}</span>
        </div>

        {filtered.length > 0 ? (
          <div className="airport-grid">
            {filtered.slice(0, 120).map(a => (
              <AirportCard key={`${a.iata}-${a.icao}`} airport={a} lang={lang} onSelect={setSelected} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">✈</div>
            <div className="empty-title">{t.noResults}</div>
            <div className="empty-hint">{t.noResultsHint}</div>
          </div>
        )}
      </main>

      {selected && (
        <AirportModal airport={selected} lang={lang} onClose={handleClose} />
      )}
    </div>
  )
}
