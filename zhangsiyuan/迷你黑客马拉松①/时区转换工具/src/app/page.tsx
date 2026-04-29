'use client'
import { useState, useMemo } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

interface TZInfo {
  id: string
  iana: string
  city: Record<Lang, string>
  airports: string
  flag: string
}

const ZONES: TZInfo[] = [
  { id: 'tokyo',     iana: 'Asia/Tokyo',             city: { zh: '东京',   en: 'Tokyo',        ja: '東京'     }, airports: 'NRT / HND', flag: '🇯🇵' },
  { id: 'osaka',     iana: 'Asia/Tokyo',             city: { zh: '大阪',   en: 'Osaka',        ja: '大阪'     }, airports: 'KIX',       flag: '🇯🇵' },
  { id: 'beijing',   iana: 'Asia/Shanghai',          city: { zh: '北京',   en: 'Beijing',      ja: '北京'     }, airports: 'PEK / PKX', flag: '🇨🇳' },
  { id: 'shanghai',  iana: 'Asia/Shanghai',          city: { zh: '上海',   en: 'Shanghai',     ja: '上海'     }, airports: 'PVG / SHA', flag: '🇨🇳' },
  { id: 'hongkong',  iana: 'Asia/Hong_Kong',         city: { zh: '香港',   en: 'Hong Kong',    ja: '香港'     }, airports: 'HKG',       flag: '🇭🇰' },
  { id: 'singapore', iana: 'Asia/Singapore',         city: { zh: '新加坡', en: 'Singapore',    ja: 'シンガポール' }, airports: 'SIN',       flag: '🇸🇬' },
  { id: 'bangkok',   iana: 'Asia/Bangkok',           city: { zh: '曼谷',   en: 'Bangkok',      ja: 'バンコク' }, airports: 'BKK / DMK', flag: '🇹🇭' },
  { id: 'dubai',     iana: 'Asia/Dubai',             city: { zh: '迪拜',   en: 'Dubai',        ja: 'ドバイ'   }, airports: 'DXB / DWC', flag: '🇦🇪' },
  { id: 'frankfurt', iana: 'Europe/Berlin',          city: { zh: '法兰克福', en: 'Frankfurt',  ja: 'フランクフルト' }, airports: 'FRA',   flag: '🇩🇪' },
  { id: 'london',    iana: 'Europe/London',          city: { zh: '伦敦',   en: 'London',       ja: 'ロンドン' }, airports: 'LHR / LGW', flag: '🇬🇧' },
  { id: 'newyork',   iana: 'America/New_York',       city: { zh: '纽约',   en: 'New York',     ja: 'ニューヨーク' }, airports: 'JFK / EWR', flag: '🇺🇸' },
  { id: 'losangeles',iana: 'America/Los_Angeles',    city: { zh: '洛杉矶', en: 'Los Angeles',  ja: 'ロサンゼルス' }, airports: 'LAX',   flag: '🇺🇸' },
]

function getOffset(iana: string, date: Date): string {
  const fmt = new Intl.DateTimeFormat('en', { timeZone: iana, timeZoneName: 'shortOffset' })
  const parts = fmt.formatToParts(date)
  return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
}

function formatTime(iana: string, date: Date): { time: string; dateStr: string } {
  const time = date.toLocaleTimeString('en-GB', { timeZone: iana, hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('en-GB', { timeZone: iana, weekday: 'short', month: 'short', day: 'numeric' })
  return { time, dateStr }
}

function getDiffLabel(sourceIana: string, targetIana: string, date: Date, lang: Lang): { label: string; cls: string } {
  const srcOff = new Intl.DateTimeFormat('en', { timeZone: sourceIana, timeZoneName: 'shortOffset' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? 'UTC+0'
  const tgtOff = new Intl.DateTimeFormat('en', { timeZone: targetIana, timeZoneName: 'shortOffset' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? 'UTC+0'
  const parseOff = (s: string) => { const m = s.match(/UTC([+-])(\d+)(?::(\d+))?/); if (!m) return 0; return (m[1]==='+' ? 1 : -1) * (parseInt(m[2]) * 60 + parseInt(m[3] ?? '0')) }
  const diff = parseOff(tgtOff) - parseOff(srcOff)
  if (diff === 0) return { label: lang === 'zh' ? '同一时区' : lang === 'en' ? 'Same TZ' : '同一時間帯', cls: 'same' }
  const h = Math.abs(diff) / 60
  const disp = h % 1 === 0 ? `${h}h` : `${h}h`
  if (diff > 0) return { label: (lang === 'zh' ? '领先 ' : lang === 'en' ? '+' : '+') + disp, cls: 'ahead' }
  return { label: (lang === 'zh' ? '落后 ' : lang === 'en' ? '' : '') + `-${disp}`, cls: 'behind' }
}

function buildDate(baseDate: Date, timeStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(h, m, 0, 0)
  return d
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [sourceId, setSourceId] = useState('tokyo')
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
  })

  const sourceZone = ZONES.find(z => z.id === sourceId)!
  const refDate = useMemo(() => buildDate(new Date(), timeStr), [timeStr])

  const sourceDateInTZ = useMemo(() => {
    const { time, dateStr } = formatTime(sourceZone.iana, refDate)
    return { time, dateStr }
  }, [sourceZone, refDate])

  const L = {
    zh: { h1: '时区转换工具', refCity: '参考城市', refTime: '参考时间', now: '现在', worldTime: '全球主要货运城市时间' },
    en: { h1: 'Timezone Converter', refCity: 'Reference City', refTime: 'Reference Time', now: 'Now', worldTime: 'Major Air Freight City Times' },
    ja: { h1: 'タイムゾーン変換', refCity: '基準都市', refTime: '基準時間', now: '現在時刻', worldTime: '主要航空貨物都市の時間' },
  }[lang]

  const setNow = () => {
    const now = new Date()
    setTimeStr(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">🌐</div>
          <span className="header-title">{L.h1}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(l => <button key={l.code} className={`lang-btn${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>)}
        </div>
      </header>
      <div className="main">
        <div className="input-panel">
          <div className="input-group">
            <label>{L.refCity}</label>
            <select value={sourceId} onChange={e => setSourceId(e.target.value)}>
              {ZONES.map(z => <option key={z.id} value={z.id}>{z.flag} {z.city[lang]} ({z.airports})</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>{L.refTime}</label>
            <input type="time" value={timeStr} onChange={e => setTimeStr(e.target.value)} />
          </div>
          <button className="now-btn" onClick={setNow}>{L.now}</button>
          <div style={{marginLeft:'auto',fontSize:'12px',color:'var(--muted)',textAlign:'right',lineHeight:'1.5'}}>
            <div style={{fontWeight:700,color:'var(--text2)'}}>{sourceDateInTZ.time}</div>
            <div>{sourceDateInTZ.dateStr}</div>
            <div style={{fontFamily:'monospace',fontSize:'11px'}}>{getOffset(sourceZone.iana, refDate)}</div>
          </div>
        </div>
        <div style={{fontSize:'12px',fontWeight:700,color:'var(--muted)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:'12px'}}>{L.worldTime}</div>
        <div className="tz-grid">
          {ZONES.map(z => {
            const { time, dateStr } = formatTime(z.iana, refDate)
            const diff = getDiffLabel(sourceZone.iana, z.iana, refDate, lang)
            const isSource = z.id === sourceId
            return (
              <div key={z.id} className={`tz-card${isSource ? ' active' : ''}`} onClick={() => setSourceId(z.id)}>
                <div className="tz-city">{z.flag} {z.city[lang]}</div>
                <div className="tz-airport">{z.airports}</div>
                <div className="tz-time">{time}</div>
                <div className="tz-date">{dateStr}</div>
                <div className="tz-offset">{getOffset(z.iana, refDate)}</div>
                {!isSource && <div className={`tz-diff ${diff.cls}`}>{diff.label}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
