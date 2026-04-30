'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

// ── Types ─────────────────────────────────────────────────────────────────────
interface Airport {
  iataCode: string
  name: string
  subType: string
  address: { cityName: string; countryName: string }
}
interface FlightSegment {
  departure: { iataCode: string; at: string; terminal?: string }
  arrival:   { iataCode: string; at: string; terminal?: string }
  carrierCode: string
  number: string
  duration: string
  numberOfStops: number
}
interface FlightItinerary { duration: string; segments: FlightSegment[] }
interface FlightOffer {
  id: string
  price: { currency: string; total: string }
  itineraries: FlightItinerary[]
  validatingAirlineCodes: string[]
  numberOfBookableSeats: number
}
interface Dictionaries { carriers: Record<string, string>; aircraft: Record<string, string> }
interface SearchResults { flights: FlightOffer[]; dictionaries: Dictionaries }

// ── Helpers ───────────────────────────────────────────────────────────────────
function ptToMins(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  return (+(m?.[1] ?? 0)) * 60 + (+(m?.[2] ?? 0))
}
function fmtDur(iso: string): string {
  const t = ptToMins(iso)
  return `${Math.floor(t / 60)}h ${t % 60}m`
}
function fmtTime(at: string): string { return at.split('T')[1]?.slice(0, 5) ?? '' }
function tomorrow(): string {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]
}
function stopsLabel(n: number, lang: Lang): string {
  if (n === 0) return { zh: '直飞', en: 'Direct', ja: '直行' }[lang]
  return { zh: `${n}次中转`, en: `${n} Stop${n > 1 ? 's' : ''}`, ja: `${n}回乗継` }[lang]
}
function layoverStr(arrAt: string, depAt: string): string {
  const m = Math.round((new Date(depAt).getTime() - new Date(arrAt).getTime()) / 60000)
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

// ── i18n ──────────────────────────────────────────────────────────────────────
const L = {
  zh: { title: '航班搜索', from: '出发地', to: '目的地', date: '出发日期',
        retDate: '返回日期', adults: '乘客人数', oneWay: '单程', roundTrip: '往返',
        directOnly: '只看直飞', search: '搜索航班', hint: '城市或机场名',
        loading: '正在搜索…', errTitle: '搜索失败', noResults: '未找到符合条件的航班',
        found: '共找到', flights: '个方案', sortPrice: '按价格', sortDur: '按时长',
        via: '经停', seats: '余票', outbound: '去程', ret: '返程',
        detail: '详情 ▼', collapse: '收起 ▲',
        noKey: '请先配置 Amadeus API 凭证（详见 .env.local）' },
  en: { title: 'Flight Search', from: 'From', to: 'To', date: 'Departure',
        retDate: 'Return', adults: 'Adults', oneWay: 'One-way', roundTrip: 'Round-trip',
        directOnly: 'Direct only', search: 'Search Flights', hint: 'City or airport',
        loading: 'Searching flights…', errTitle: 'Search failed', noResults: 'No flights found',
        found: 'Found', flights: 'results', sortPrice: 'Price', sortDur: 'Duration',
        via: 'via', seats: 'seats left', outbound: 'Outbound', ret: 'Return',
        detail: 'Details ▼', collapse: 'Hide ▲',
        noKey: 'Configure Amadeus credentials in .env.local first' },
  ja: { title: '航空券検索', from: '出発地', to: '目的地', date: '出発日',
        retDate: '帰国日', adults: '乗客数', oneWay: '片道', roundTrip: '往復',
        directOnly: '直行便のみ', search: '検索', hint: '都市・空港名',
        loading: '検索中…', errTitle: '検索失敗', noResults: '便が見つかりません',
        found: '', flights: '件見つかりました', sortPrice: '料金順', sortDur: '所要時間順',
        via: '経由', seats: '席残り', outbound: '往路', ret: '帰路',
        detail: '詳細 ▼', collapse: '閉じる ▲',
        noKey: '.env.local に Amadeus 認証情報を設定してください' },
} as const
type LKeys = keyof typeof L.zh

// ── Airport autocomplete component ────────────────────────────────────────────
function AirportInput({ value, onChange, placeholder }: {
  value: Airport | null
  onChange: (a: Airport | null) => void
  placeholder: string
}) {
  const [query, setQuery]     = useState(value ? `${value.iataCode} – ${value.address.cityName}` : '')
  const [options, setOptions] = useState<Airport[]>([])
  const [open, setOpen]       = useState(false)
  const [busy, setBusy]       = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrap  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  useEffect(() => { if (!value) setQuery('') }, [value])

  const handleChange = (q: string) => {
    setQuery(q)
    if (value) onChange(null)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 2) { setOptions([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setBusy(true)
      try {
        const res = await fetch(`/api/airports?q=${encodeURIComponent(q)}`)
        const d = await res.json() as { data?: Airport[] }
        setOptions(d.data ?? [])
        setOpen(true)
      } catch { setOptions([]) } finally { setBusy(false) }
    }, 300)
  }

  const pick = (a: Airport) => {
    onChange(a)
    setQuery(`${a.iataCode} – ${a.address.cityName}`)
    setOpen(false)
    setOptions([])
  }

  return (
    <div className="ap-wrap" ref={wrap}>
      <div className={`ap-field${value ? ' ap-selected' : ''}`}>
        <input
          className="ap-input"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => options.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {busy && <span className="ap-spin" />}
        {value && (
          <button className="ap-clear" onMouseDown={e => { e.preventDefault(); onChange(null); setQuery(''); setOptions([]) }}>×</button>
        )}
      </div>
      {open && options.length > 0 && (
        <div className="ap-dropdown">
          {options.map(a => (
            <button key={`${a.iataCode}-${a.subType}`} className="ap-opt" onMouseDown={() => pick(a)}>
              <span className="ap-code">{a.iataCode}</span>
              <div className="ap-detail">
                <span className="ap-city">{a.address.cityName}</span>
                <span className="ap-name">{a.name}</span>
              </div>
              <span className="ap-badge">{a.subType === 'AIRPORT' ? '✈' : '🏙'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Flight card component ─────────────────────────────────────────────────────
function FlightCard({ offer, dicts, lang }: {
  offer: FlightOffer; dicts: Dictionaries; lang: Lang
}) {
  const [expanded, setExpanded] = useState(false)
  const l = L[lang]

  return (
    <div className="flight-card">
      {offer.itineraries.map((itin, idx) => {
        const segs  = itin.segments
        const first = segs[0]
        const last  = segs[segs.length - 1]
        const stops = segs.length - 1
        const carriers = [...new Set(segs.map(s => s.carrierCode))]
        const carrierNames = carriers.map(c => dicts.carriers?.[c] ?? c).join(' + ')
        const flightNums   = segs.map(s => `${s.carrierCode}${s.number}`).join(' / ')

        return (
          <div key={idx} className={`itin${idx > 0 ? ' itin-return' : ''}`}>
            {offer.itineraries.length > 1 && (
              <div className={`itin-label${idx > 0 ? ' itin-label-return' : ''}`}>
                {idx === 0 ? l.outbound : l.ret}
              </div>
            )}

            {/* Departure → Arrival row */}
            <div className="route-row">
              <div className="route-point">
                <span className="r-time">{fmtTime(first.departure.at)}</span>
                <span className="r-iata">{first.departure.iataCode}</span>
                {first.departure.terminal && <span className="r-term">T{first.departure.terminal}</span>}
              </div>

              <div className="route-mid">
                <span className="r-dur">{fmtDur(itin.duration)}</span>
                <div className="r-line">
                  {segs.slice(0, -1).map((_, i) => <span key={i} className="r-dot" />)}
                </div>
                <span className={`r-stops${stops === 0 ? ' direct' : ''}`}>
                  {stopsLabel(stops, lang)}
                </span>
              </div>

              <div className="route-point route-point-r">
                <span className="r-time">{fmtTime(last.arrival.at)}</span>
                <span className="r-iata">{last.arrival.iataCode}</span>
                {last.arrival.terminal && <span className="r-term">T{last.arrival.terminal}</span>}
              </div>
            </div>

            {/* Airline info */}
            <div className="flight-info-row">
              <span className="carrier-name">{carrierNames}</span>
              <span className="flight-num">{flightNums}</span>
            </div>

            {/* Layover tags */}
            {stops > 0 && (
              <div className="conn-row">
                {segs.slice(0, -1).map((seg, i) => (
                  <span key={i} className="conn-tag">
                    {l.via} {seg.arrival.iataCode} · {layoverStr(seg.arrival.at, segs[i + 1].departure.at)}
                  </span>
                ))}
              </div>
            )}

            {/* Expanded segment details */}
            {expanded && segs.map((seg, i) => (
              <div key={i} className="seg-detail">
                <span className="seg-flight">{seg.carrierCode}{seg.number}</span>
                <span className="seg-route">
                  {seg.departure.iataCode} {fmtTime(seg.departure.at)} → {seg.arrival.iataCode} {fmtTime(seg.arrival.at)}
                </span>
                <span className="seg-dur">{fmtDur(seg.duration)}</span>
              </div>
            ))}
          </div>
        )
      })}

      {/* Price + expand toggle */}
      <div className="card-footer">
        <div className="price-block">
          <span className="price-total">{offer.price.currency} {parseFloat(offer.price.total).toFixed(0)}</span>
          <span className="price-seats">{offer.numberOfBookableSeats} {l.seats}</span>
        </div>
        <button className="expand-btn" onClick={() => setExpanded(v => !v)}>
          {expanded ? l.collapse : l.detail}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [lang, setLang]         = useState<Lang>('zh')
  const l = L[lang] as Record<LKeys, string>

  const [origin, setOrigin]     = useState<Airport | null>(null)
  const [dest, setDest]         = useState<Airport | null>(null)
  const [date, setDate]         = useState(tomorrow)
  const [retDate, setRetDate]   = useState('')
  const [adults, setAdults]     = useState(1)
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip'>('oneWay')
  const [nonStop, setNonStop]   = useState(false)
  const [sortBy, setSortBy]     = useState<'price' | 'duration'>('price')

  const [results, setResults]   = useState<SearchResults | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [needsConfig, setNeedsConfig] = useState(false)

  const canSearch = !!(origin && dest && date)

  const doSearch = useCallback(async () => {
    if (!canSearch) return
    setLoading(true); setError(null); setSearched(true); setNeedsConfig(false)
    try {
      const p = new URLSearchParams({
        origin: origin!.iataCode,
        destination: dest!.iataCode,
        date,
        adults: String(adults),
        nonStop: String(nonStop),
      })
      if (tripType === 'roundTrip' && retDate) p.set('returnDate', retDate)

      const res = await fetch(`/api/flights?${p}`)
      const d = await res.json() as SearchResults & { error?: string }
      if (d.error) {
        if (d.error.includes('not configured')) { setNeedsConfig(true); return }
        throw new Error(d.error)
      }
      setResults(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setLoading(false)
    }
  }, [canSearch, origin, dest, date, retDate, adults, tripType, nonStop])

  const sorted = useMemo(() => {
    if (!results?.flights) return []
    return [...results.flights].sort((a, b) =>
      sortBy === 'price'
        ? parseFloat(a.price.total) - parseFloat(b.price.total)
        : ptToMins(a.itineraries[0].duration) - ptToMins(b.itineraries[0].duration)
    )
  }, [results, sortBy])

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">✈</div>
          <span className="header-title">{l.title}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(({ code, label }) => (
            <button key={code} className={`lang-btn${lang === code ? ' active' : ''}`} onClick={() => setLang(code)}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="main">
        {/* Search card */}
        <div className="search-card">
          {/* Trip type */}
          <div className="trip-row">
            {(['oneWay', 'roundTrip'] as const).map(t => (
              <button key={t} className={`trip-btn${tripType === t ? ' active' : ''}`} onClick={() => setTripType(t)}>
                {l[t]}
              </button>
            ))}
            <label className="direct-check">
              <input type="checkbox" checked={nonStop} onChange={e => setNonStop(e.target.checked)} />
              {l.directOnly}
            </label>
          </div>

          {/* Search fields */}
          <div className="search-fields">
            <div className="field-group field-group-wide">
              <label className="field-label">{l.from}</label>
              <AirportInput value={origin} onChange={setOrigin} placeholder={l.hint} />
            </div>

            <div className="swap-col">
              <button className="swap-btn" onClick={() => { setOrigin(dest); setDest(origin) }}>⇄</button>
            </div>

            <div className="field-group field-group-wide">
              <label className="field-label">{l.to}</label>
              <AirportInput value={dest} onChange={setDest} placeholder={l.hint} />
            </div>

            <div className="field-group field-group-date">
              <label className="field-label">{l.date}</label>
              <input
                className="date-input" type="date" value={date} min={tomorrow()}
                onChange={e => { setDate(e.target.value); if (retDate && e.target.value > retDate) setRetDate('') }}
              />
            </div>

            {tripType === 'roundTrip' && (
              <div className="field-group field-group-date">
                <label className="field-label">{l.retDate}</label>
                <input
                  className="date-input" type="date" value={retDate} min={date || tomorrow()}
                  onChange={e => setRetDate(e.target.value)}
                />
              </div>
            )}

            <div className="field-group field-group-sm">
              <label className="field-label">{l.adults}</label>
              <div className="num-row">
                <button className="num-btn" onClick={() => setAdults(v => Math.max(1, v - 1))}>−</button>
                <span className="num-val">{adults}</span>
                <button className="num-btn" onClick={() => setAdults(v => Math.min(9, v + 1))}>+</button>
              </div>
            </div>
          </div>

          <button className="search-btn" onClick={doSearch} disabled={!canSearch || loading}>
            {loading ? l.loading : l.search}
          </button>
        </div>

        {/* Status messages */}
        {needsConfig && (
          <div className="config-banner">⚙️ {l.noKey}</div>
        )}
        {!loading && error && (
          <div className="error-banner"><b>{l.errTitle}</b> — {error}</div>
        )}
        {loading && (
          <div className="loading-full">
            <div className="spinner" />
            <span>{l.loading}</span>
          </div>
        )}
        {!loading && searched && !error && !needsConfig && results && results.flights.length === 0 && (
          <div className="no-results">
            <div className="no-results-icon">✈️</div>
            <div className="no-results-text">{l.noResults}</div>
          </div>
        )}

        {/* Results */}
        {!loading && results && results.flights.length > 0 && (
          <div>
            <div className="results-header">
              <span className="results-count">
                {l.found} {results.flights.length} {l.flights}
              </span>
              <div className="sort-btns">
                {(['price', 'duration'] as const).map(s => (
                  <button key={s} className={`sort-btn${sortBy === s ? ' active' : ''}`} onClick={() => setSortBy(s)}>
                    {s === 'price' ? l.sortPrice : l.sortDur}
                  </button>
                ))}
              </div>
            </div>
            <div className="flights-list">
              {sorted.map(offer => (
                <FlightCard key={offer.id} offer={offer} dicts={results.dictionaries} lang={lang} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
