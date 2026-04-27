'use client'
// useState 示例：
//  - lang          语言切换
//  - origin/dest   选中的机场
//  - transport     运输类型
//  - weight/unit   重量和单位
//  - margin        利润率
//  - result        计算结果
//  - error         错误提示
import { useState } from 'react'
import translations, { type Lang } from '@/data/translations'
import { type Airport } from '@/data/airports'
import { calculate, type CalcResult, type TransportType } from '@/data/rates'
import AirportSearch from '@/components/AirportSearch'
import RouteMap from '@/components/RouteMap'
import PriceBreakdown from '@/components/PriceBreakdown'

export default function Page() {
  const [lang, setLang]           = useState<Lang>('zh')
  const [origin, setOrigin]       = useState<Airport | null>(null)
  const [dest, setDest]           = useState<Airport | null>(null)
  const [transport, setTransport] = useState<TransportType>('ECO')
  const [weight, setWeight]       = useState('')
  const [unit, setUnit]           = useState<'kg' | 'lb'>('kg')
  const [margin, setMargin]       = useState('30')
  const [result, setResult]       = useState<CalcResult | null>(null)
  const [error, setError]         = useState('')

  const t = translations[lang]

  function handleCalculate() {
    setError('')
    if (!origin)               return setError(t.errors.no_origin)
    if (!dest)                 return setError(t.errors.no_destination)
    if (origin.code === dest.code) return setError(t.errors.same_airport)
    if (!weight.trim())        return setError(t.errors.no_weight)

    const rawKg = unit === 'lb'
      ? parseFloat(weight) * 0.453592
      : parseFloat(weight)

    if (isNaN(rawKg) || rawKg <= 0) return setError(t.errors.invalid_weight)

    const marginNum = parseFloat(margin) || 30
    setResult(calculate(origin.lat, origin.lng, dest.lat, dest.lng, rawKg, transport, marginNum))
  }

  function handleReset() {
    setOrigin(null); setDest(null); setTransport('ECO')
    setWeight(''); setUnit('kg'); setMargin('30')
    setResult(null); setError('')
  }

  const showMap = !!(origin && dest && origin.code !== dest.code)

  return (
    <>
      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <span className="logo-icon">✈</span>
            <span className="logo-text">Cargo<span>Cost</span></span>
            <span className="header-sub">{t.app.subtitle}</span>
          </div>
          <div className="lang-sw">
            {(['ja', 'zh', 'en'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)} className={`ls-btn${lang === l ? ' active' : ''}`}>
                {t.lang_label[l]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">
        <div className="calc-grid">

          {/* ── Left: Form ── */}
          <div className="card">
            <p className="card-title">{t.app.title}</p>
            <div className="form-body">

              {/* Origin */}
              <div className="field">
                <label className="label">{t.form.origin}</label>
                <AirportSearch value={origin} onChange={setOrigin} placeholder={t.form.placeholder} lang={lang} />
              </div>

              {/* Destination */}
              <div className="field">
                <label className="label">{t.form.destination}</label>
                <AirportSearch value={dest} onChange={setDest} placeholder={t.form.placeholder} lang={lang} />
              </div>

              {/* Transport type */}
              <div className="field">
                <label className="label">{t.form.transport}</label>
                <div className="transport-btns">
                  {(['NFO', 'OBC', 'ECO'] as TransportType[]).map(tp => (
                    <button key={tp} className={`t-btn${transport === tp ? ' active' : ''}`} onClick={() => setTransport(tp)}>
                      <span className="t-btn-label">{t.transport[tp].label}</span>
                      <span className="t-btn-name">{t.transport[tp].name}</span>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  {t.transport[transport].desc}
                </p>
              </div>

              {/* Weight */}
              <div className="field">
                <label className="label">{t.form.weight}</label>
                <div className="weight-row">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    className="weight-input"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                    placeholder="e.g. 50"
                  />
                  <div className="unit-toggle">
                    <button className={`unit-btn${unit === 'kg' ? ' active' : ''}`} onClick={() => setUnit('kg')}>{t.form.kg}</button>
                    <button className={`unit-btn${unit === 'lb' ? ' active' : ''}`} onClick={() => setUnit('lb')}>{t.form.lb}</button>
                  </div>
                </div>
              </div>

              {/* Margin */}
              <div className="field">
                <label className="label">{t.form.margin}</label>
                <div className="margin-row">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="1"
                    className="margin-input"
                    value={margin}
                    onChange={e => setMargin(e.target.value)}
                  />
                  <span className="margin-pct">{t.form.margin_unit}</span>
                </div>
              </div>

              {/* Error */}
              {error && <div className="error-msg">{error}</div>}

              {/* Buttons */}
              <div className="form-actions">
                <button className="btn-calc" onClick={handleCalculate}>{t.form.calculate}</button>
                <button className="btn-reset" onClick={handleReset}>{t.form.reset}</button>
              </div>
            </div>
          </div>

          {/* ── Right: Map + Result ── */}
          <div className="right-col">

            {/* Map */}
            {showMap
              ? <RouteMap origin={origin!} destination={dest!} lang={lang} />
              : (
                <div className="map-placeholder">
                  <span className="map-placeholder-icon">🗺</span>
                  <span className="map-placeholder-text">{t.map_title}</span>
                </div>
              )
            }

            {/* Price breakdown */}
            {result && (
              <div className="card">
                <PriceBreakdown result={result} t={t.result} />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <ul className="notes">
          {t.notes.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      </main>

      <footer className="footer">{t.footer}</footer>
    </>
  )
}
