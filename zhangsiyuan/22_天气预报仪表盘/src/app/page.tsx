'use client'
import { useState, useEffect, useCallback } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

// ── API response types ────────────────────────────────────────────────────────
interface HourlyItem { time: string; temp: number; code: number; precipProb: number; isDay: boolean }
interface DailyItem  { date: string; tempMax: number; tempMin: number; code: number; precipProb: number; precipSum: number }
interface CurrentWeather {
  time: string; temp: number; feelsLike: number; humidity: number
  code: number; windSpeed: number; windDir: number; precipitation: number; isDay: boolean
}
interface CityData {
  id: string; tz: string
  current: CurrentWeather | null
  hourly: HourlyItem[]
  daily: DailyItem[]
  error: string | null
}
interface WeatherResponse { cities: CityData[]; fetchedAt: string }

// ── City display metadata ─────────────────────────────────────────────────────
const CITY_META: Record<string, { zh: string; en: string; ja: string; flag: string; country: Record<Lang, string> }> = {
  tokyo:    { zh: '东京', en: 'Tokyo',    ja: '東京', flag: '🇯🇵', country: { zh: '日本', en: 'Japan',  ja: '日本' } },
  shanghai: { zh: '上海', en: 'Shanghai', ja: '上海', flag: '🇨🇳', country: { zh: '中国', en: 'China',  ja: '中国' } },
  yantai:   { zh: '烟台', en: 'Yantai',   ja: '煙台', flag: '🇨🇳', country: { zh: '中国', en: 'China',  ja: '中国' } },
}

// ── WMO weather code → icon + label ──────────────────────────────────────────
// [minCode, maxCode, dayIcon, nightIcon, zh, en, ja]
const WMO: [number, number, string, string, string, string, string][] = [
  [0,  0,  '☀️', '🌙', '晴',     'Clear',        '快晴'],
  [1,  1,  '🌤️', '🌙', '晴间多云', 'Mainly Clear', '晴れ'],
  [2,  2,  '⛅',  '⛅', '多云',    'Partly Cloudy', '曇りがち'],
  [3,  3,  '☁️',  '☁️', '阴',     'Overcast',     '曇り'],
  [45, 48, '🌫️', '🌫️', '雾',     'Fog',          '霧'],
  [51, 55, '🌦️', '🌦️', '毛毛雨',  'Drizzle',      '霧雨'],
  [61, 65, '🌧️', '🌧️', '雨',     'Rain',         '雨'],
  [71, 77, '❄️',  '❄️', '雪',     'Snow',         '雪'],
  [80, 82, '🌦️', '🌦️', '阵雨',   'Showers',      'にわか雨'],
  [85, 86, '🌨️', '🌨️', '阵雪',   'Snow Showers', '雪'],
  [95, 99, '⛈️',  '⛈️', '雷阵雨', 'Thunderstorm', '雷雨'],
]
function weatherInfo(code: number, isDay: boolean, lang: Lang): { icon: string; desc: string } {
  const row = WMO.find(([min, max]) => code >= min && code <= max) ?? WMO[0]
  return { icon: isDay ? row[2] : row[3], desc: ({ zh: row[4], en: row[5], ja: row[6] } as Record<Lang, string>)[lang] }
}

const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
function windDirLabel(deg: number): string { return WIND_DIRS[Math.round(deg / 45) % 8] }

function tempClass(t: number): string {
  if (t >= 32) return 'temp-hot'
  if (t >= 22) return 'temp-warm'
  if (t >= 8)  return 'temp-cool'
  return 'temp-cold'
}

function dayLabel(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr + 'T12:00:00')
  const today = new Date(); today.setHours(12, 0, 0, 0)
  const tom = new Date(today); tom.setDate(tom.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return { zh: '今天', en: 'Today', ja: '今日' }[lang]
  if (d.toDateString() === tom.toDateString())   return { zh: '明天', en: 'Tomorrow', ja: '明日' }[lang]
  const locale = lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US'
  return d.toLocaleDateString(locale, { weekday: 'short' })
}

// ── i18n strings ──────────────────────────────────────────────────────────────
const L = {
  zh: { title: '天气预报仪表盘', sub: '东京・上海・烟台', loading: '正在获取天气数据…', errTitle: '获取天气数据失败',
        retry: '重试', feelsLike: '体感', humidity: '湿度', wind: '风速', precip: '降水',
        hourly: '今日逐时', week: '未来 7 天', updated: '更新于', cityErr: '数据获取失败' },
  en: { title: 'Weather Dashboard', sub: 'Tokyo · Shanghai · Yantai', loading: 'Fetching weather…', errTitle: 'Failed to load weather data',
        retry: 'Retry', feelsLike: 'Feels like', humidity: 'Humidity', wind: 'Wind', precip: 'Precip.',
        hourly: 'Hourly Today', week: '7-Day Forecast', updated: 'Updated', cityErr: 'Failed to load' },
  ja: { title: '天気予報ダッシュボード', sub: '東京・上海・煙台', loading: '天気データを取得中…', errTitle: '天気データの取得に失敗',
        retry: '再試行', feelsLike: '体感', humidity: '湿度', wind: '風速', precip: '降水',
        hourly: '今日の時間別', week: '週間予報', updated: '更新時刻', cityErr: 'データ取得失敗' },
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [data, setData]       = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [now, setNow]         = useState(new Date())

  const loadWeather = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/weather')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json() as WeatherResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadWeather() }, [loadWeather])
  // Update displayed clock every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const l = L[lang]

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🌤</div>
          <div>
            <div className="header-title">{l.title}</div>
            <div className="header-sub">{l.sub}</div>
          </div>
        </div>
        <div className="header-right">
          <button className="refresh-btn" onClick={loadWeather} disabled={loading} title="Refresh">↻</button>
          <div className="lang-switcher">
            {LANGS.map(({ code, label }) => (
              <button key={code} className={`lang-btn${lang === code ? ' active' : ''}`} onClick={() => setLang(code)}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      <main className="main">
        {loading && (
          <div className="loading-full">
            <div className="spinner" />
            <span>{l.loading}</span>
          </div>
        )}

        {!loading && error && (
          <div className="error-full">
            <div className="error-icon">⚠️</div>
            <div className="error-title">{l.errTitle}</div>
            <div className="error-msg">{error}</div>
            <button className="retry-btn" onClick={loadWeather}>{l.retry}</button>
          </div>
        )}

        {!loading && data && (
          <>
            <div className="weather-grid">
              {data.cities.map(city => (
                <CityCard key={city.id} city={city} lang={lang} now={now} l={l} />
              ))}
            </div>
            <div className="footer-info">
              <span>{l.updated}: {new Date(data.fetchedAt).toLocaleTimeString(
                lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja-JP' : 'en-US',
                { hour: '2-digit', minute: '2-digit' }
              )}</span>
              <span className="footer-dot">·</span>
              <span>Open-Meteo</span>
              <span className="footer-dot">·</span>
              <span>Free & No API Key Required</span>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ── City card ─────────────────────────────────────────────────────────────────
function CityCard({ city, lang, now, l }: {
  city: CityData; lang: Lang; now: Date
  l: typeof L[Lang]
}) {
  const meta = CITY_META[city.id]
  const localTime = now.toLocaleTimeString('en', {
    timeZone: city.tz, hour: '2-digit', minute: '2-digit', hour12: false,
  })

  if (city.error || !city.current) {
    return (
      <div className="city-card city-card-error">
        <div className="city-header">
          <span className="city-flag">{meta?.flag}</span>
          <div className="city-name-group">
            <span className="city-name">{meta?.[lang]}</span>
            <span className="city-country">{meta?.country[lang]}</span>
          </div>
        </div>
        <div className="card-error-body">
          <div className="card-error-icon">⚠️</div>
          <div className="card-error-msg">{l.cityErr}</div>
          {city.error && <div className="card-error-detail">{city.error}</div>}
        </div>
      </div>
    )
  }

  const { current, hourly, daily } = city
  const { icon: curIcon, desc: curDesc } = weatherInfo(current.code, current.isDay, lang)

  return (
    <div className="city-card">
      {/* ── City header ── */}
      <div className="city-header">
        <span className="city-flag">{meta?.flag}</span>
        <div className="city-name-group">
          <span className="city-name">{meta?.[lang]}</span>
          <span className="city-country">{meta?.country[lang]}</span>
        </div>
        <span className="city-time">{localTime}</span>
      </div>

      {/* ── Current conditions ── */}
      <div className="current-section">
        <div className="current-main">
          <span className="current-icon">{curIcon}</span>
          <div className="current-temp-group">
            <span className={`current-temp ${tempClass(current.temp)}`}>{current.temp}°</span>
            <span className="current-desc">{curDesc}</span>
          </div>
        </div>
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">{l.feelsLike}</span>
            <span className="stat-value">{current.feelsLike}°C</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{l.humidity}</span>
            <span className="stat-value">{current.humidity}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{l.wind}</span>
            <span className="stat-value">{current.windSpeed} <small>km/h {windDirLabel(current.windDir)}</small></span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{l.precip}</span>
            <span className="stat-value">{current.precipitation} <small>mm</small></span>
          </div>
        </div>
      </div>

      {/* ── Hourly forecast ── */}
      {hourly.length > 0 && (
        <div className="forecast-section">
          <div className="section-title">{l.hourly}</div>
          <div className="hourly-strip">
            {hourly.map((h, i) => {
              const { icon } = weatherInfo(h.code, h.isDay, lang)
              return (
                <div key={i} className="hourly-item">
                  <div className="hourly-time">{h.time}</div>
                  <div className="hourly-icon">{icon}</div>
                  <div className={`hourly-temp ${tempClass(h.temp)}`}>{h.temp}°</div>
                  {h.precipProb > 0 && <div className="hourly-precip">💧{h.precipProb}%</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── 7-day daily forecast ── */}
      <div className="forecast-section">
        <div className="section-title">{l.week}</div>
        <div className="daily-list">
          {daily.map((d, i) => {
            const { icon } = weatherInfo(d.code, true, lang)
            return (
              <div key={i} className="daily-item">
                <span className="daily-day">{dayLabel(d.date, lang)}</span>
                <span className="daily-icon">{icon}</span>
                <div className="daily-precip-wrap">
                  {d.precipProb > 10 && <span className="daily-precip">💧{d.precipProb}%</span>}
                </div>
                <div className="daily-temps">
                  <span className={`daily-max ${tempClass(d.tempMax)}`}>{d.tempMax}°</span>
                  <span className="daily-sep">/</span>
                  <span className="daily-min">{d.tempMin}°</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
