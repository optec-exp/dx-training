'use client'
import { useState } from 'react'

type Lang = 'zh' | 'en' | 'ja'
const LANGS = [{ code: 'zh' as Lang, label: '中文' }, { code: 'en' as Lang, label: 'EN' }, { code: 'ja' as Lang, label: '日本語' }]

interface TrackEvent {
  status: Record<Lang, string>
  location: string
  time: string
  note?: Record<Lang, string>
  state: 'done' | 'current' | 'pending'
}

interface Shipment {
  awb: string
  origin: string
  dest: string
  carrier: string
  cargo: Record<Lang, string>
  weight: string
  pieces: number
  status: 'delivered' | 'transit' | 'delayed' | 'customs'
  events: TrackEvent[]
}

const SAMPLES: Shipment[] = [
  {
    awb: '180-12345678',
    origin: 'Tokyo (NRT)',
    dest: 'Frankfurt (FRA)',
    carrier: 'Lufthansa Cargo',
    cargo: { zh: '电子元器件', en: 'Electronic Components', ja: '電子部品' },
    weight: '320 kg',
    pieces: 4,
    status: 'transit',
    events: [
      { status:{zh:'货物已交付承运人',en:'Shipment accepted',ja:'貨物受付'}, location:'Tokyo (NRT)', time:'2026-04-26 14:30', state:'done' },
      { status:{zh:'货物已起飞',en:'Departed origin',ja:'出発'}, location:'Tokyo (NRT)', time:'2026-04-26 22:15', state:'done' },
      { status:{zh:'中转地到达',en:'Arrived at transit hub',ja:'経由地到着'}, location:'Dubai (DXB)', time:'2026-04-27 06:40', state:'done' },
      { status:{zh:'中转地起飞',en:'Departed transit hub',ja:'経由地出発'}, location:'Dubai (DXB)', time:'2026-04-27 10:20', state:'done' },
      { status:{zh:'到达目的地机场',en:'Arrived at destination',ja:'目的地到着'}, location:'Frankfurt (FRA)', time:'2026-04-27 15:55', state:'current' },
      { status:{zh:'清关中',en:'Customs clearance',ja:'通関中'}, location:'Frankfurt (FRA)', time:'', state:'pending' },
      { status:{zh:'货物已送达',en:'Delivered',ja:'配達完了'}, location:'Frankfurt (FRA)', time:'', state:'pending' },
    ],
  },
  {
    awb: '235-98765432',
    origin: 'Shanghai (PVG)',
    dest: 'Los Angeles (LAX)',
    carrier: 'Air China Cargo',
    cargo: { zh: '服装纺织品', en: 'Garments & Textiles', ja: '衣料品' },
    weight: '1,840 kg',
    pieces: 18,
    status: 'delivered',
    events: [
      { status:{zh:'货物已交付承运人',en:'Shipment accepted',ja:'貨物受付'}, location:'Shanghai (PVG)', time:'2026-04-21 09:00', state:'done' },
      { status:{zh:'货物已起飞',en:'Departed origin',ja:'出発'}, location:'Shanghai (PVG)', time:'2026-04-21 23:30', state:'done' },
      { status:{zh:'到达目的地机场',en:'Arrived at destination',ja:'目的地到着'}, location:'Los Angeles (LAX)', time:'2026-04-22 18:15', state:'done' },
      { status:{zh:'清关完成',en:'Customs cleared',ja:'通関完了'}, location:'Los Angeles (LAX)', time:'2026-04-23 11:40', state:'done' },
      { status:{zh:'货物已送达',en:'Delivered',ja:'配達完了'}, location:'Los Angeles Warehouse', time:'2026-04-23 16:30', state:'done' },
    ],
  },
  {
    awb: '083-55501234',
    origin: 'Hong Kong (HKG)',
    dest: 'London (LHR)',
    carrier: 'Cathay Pacific Cargo',
    cargo: { zh: '精密仪器', en: 'Precision Instruments', ja: '精密機器' },
    weight: '156 kg',
    pieces: 2,
    status: 'delayed',
    events: [
      { status:{zh:'货物已交付承运人',en:'Shipment accepted',ja:'貨物受付'}, location:'Hong Kong (HKG)', time:'2026-04-24 11:00', state:'done' },
      { status:{zh:'货物已起飞',en:'Departed origin',ja:'出発'}, location:'Hong Kong (HKG)', time:'2026-04-24 20:45', state:'done' },
      { status:{zh:'航班延误 — 等待改签',en:'Flight delayed — awaiting rebooking',ja:'フライト遅延 — 再予約待ち'}, location:'Hong Kong (HKG)', time:'2026-04-25 03:00', state:'current',
        note:{zh:'原航班取消，预计延误36小时',en:'Original flight cancelled, estimated 36-hour delay',ja:'元のフライトがキャンセルされました。約36時間の遅延が見込まれます。'} },
      { status:{zh:'货物已起飞',en:'Departed origin',ja:'出発'}, location:'Hong Kong (HKG)', time:'', state:'pending' },
      { status:{zh:'到达目的地机场',en:'Arrived at destination',ja:'目的地到着'}, location:'London (LHR)', time:'', state:'pending' },
      { status:{zh:'清关中',en:'Customs clearance',ja:'通関中'}, location:'London (LHR)', time:'', state:'pending' },
      { status:{zh:'货物已送达',en:'Delivered',ja:'配達完了'}, location:'London (LHR)', time:'', state:'pending' },
    ],
  },
  {
    awb: '618-77742000',
    origin: 'Singapore (SIN)',
    dest: 'Amsterdam (AMS)',
    carrier: 'Singapore Airlines Cargo',
    cargo: { zh: '医药品', en: 'Pharmaceuticals', ja: '医薬品' },
    weight: '490 kg',
    pieces: 6,
    status: 'customs',
    events: [
      { status:{zh:'货物已交付承运人',en:'Shipment accepted',ja:'貨物受付'}, location:'Singapore (SIN)', time:'2026-04-25 08:30', state:'done' },
      { status:{zh:'货物已起飞',en:'Departed origin',ja:'出発'}, location:'Singapore (SIN)', time:'2026-04-25 14:00', state:'done' },
      { status:{zh:'到达目的地机场',en:'Arrived at destination',ja:'目的地到着'}, location:'Amsterdam (AMS)', time:'2026-04-26 19:20', state:'done' },
      { status:{zh:'海关扣押检查中',en:'Held for customs inspection',ja:'税関検査中'}, location:'Amsterdam (AMS)', time:'2026-04-27 09:00', state:'current',
        note:{zh:'需要额外文件：原产地证书',en:'Additional documents required: Certificate of Origin',ja:'追加書類が必要です：原産地証明書'} },
      { status:{zh:'清关完成',en:'Customs cleared',ja:'通関完了'}, location:'Amsterdam (AMS)', time:'', state:'pending' },
      { status:{zh:'货物已送达',en:'Delivered',ja:'配達完了'}, location:'Amsterdam (AMS)', time:'', state:'pending' },
    ],
  },
]

const STATUS_LABELS: Record<string, Record<Lang, string>> = {
  delivered: { zh: '已送达', en: 'Delivered', ja: '配達完了' },
  transit:   { zh: '运输中', en: 'In Transit', ja: '輸送中' },
  delayed:   { zh: '延误',   en: 'Delayed',    ja: '遅延中' },
  customs:   { zh: '清关中', en: 'In Customs', ja: '通関中' },
}

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const [query, setQuery] = useState('')
  const [current, setCurrent] = useState<Shipment | null>(null)

  const L = {
    zh: { h1: '货物追踪', awb: 'AWB 号码', track: '追踪', samples: '示例AWB', timeline: '追踪时间线', route: '航线', carrier: '承运人', cargo: '货物', weight: '重量', pieces: '件数' },
    en: { h1: 'Cargo Tracker', awb: 'AWB Number', track: 'Track', samples: 'Sample AWBs', timeline: 'Tracking Timeline', route: 'Route', carrier: 'Carrier', cargo: 'Cargo', weight: 'Weight', pieces: 'Pcs' },
    ja: { h1: '貨物追跡', awb: 'AWB番号', track: '追跡', samples: '追跡番号サンプル', timeline: '追跡タイムライン', route: '路線', carrier: '航空会社', cargo: '品目', weight: '重量', pieces: '個数' },
  }[lang]

  const handle = (awb: string) => {
    const found = SAMPLES.find(s => s.awb.replace(/-/g,'') === awb.replace(/-/g,'').replace(/\s/g,''))
    setCurrent(found || null)
    if (!found) alert(lang==='zh'?`未找到 AWB: ${awb}`:lang==='en'?`AWB not found: ${awb}`:`AWBが見つかりません: ${awb}`)
  }

  const statusCls = (s: string) => ({ delivered:'status-delivered', transit:'status-transit', delayed:'status-delayed', customs:'status-customs' }[s] ?? '')

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="header-icon">📦</div>
          <span className="header-title">{L.h1}</span>
        </div>
        <div className="lang-switcher">
          {LANGS.map(l => <button key={l.code} className={`lang-btn${lang === l.code ? ' active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>)}
        </div>
      </header>
      <div className="main">
        <div className="search-bar">
          <div>
            <label>{L.awb}</label>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && handle(query)} placeholder="180-12345678" />
          </div>
          <button className="search-btn" onClick={() => handle(query)}>{L.track}</button>
          <div>
            <div style={{fontSize:'11px',color:'var(--muted)',marginBottom:'6px'}}>{L.samples}:</div>
            <div className="sample-btns">
              {SAMPLES.map(s => <button key={s.awb} className="sample-btn" onClick={() => { setQuery(s.awb); handle(s.awb) }}>{s.awb}</button>)}
            </div>
          </div>
        </div>

        {current ? (
          <>
            <div className="ship-card">
              <div className="ship-awb">{current.awb}</div>
              <div className="ship-route">
                <span>{current.origin}</span>
                <span>→</span>
                <span>{current.dest}</span>
                <span className={`status-badge ${statusCls(current.status)}`} style={{marginLeft:'auto'}}>
                  {current.status === 'delivered' ? '✓ ' : current.status === 'delayed' ? '⚠ ' : ''}
                  {STATUS_LABELS[current.status][lang]}
                </span>
              </div>
              <div className="ship-meta">
                <div className="ship-meta-item"><div className="ship-meta-label">{L.carrier}</div><div className="ship-meta-value">{current.carrier}</div></div>
                <div className="ship-meta-item"><div className="ship-meta-label">{L.cargo}</div><div className="ship-meta-value">{current.cargo[lang]}</div></div>
                <div className="ship-meta-item"><div className="ship-meta-label">{L.weight}</div><div className="ship-meta-value">{current.weight}</div></div>
                <div className="ship-meta-item"><div className="ship-meta-label">{L.pieces}</div><div className="ship-meta-value">{current.pieces} pcs</div></div>
              </div>
            </div>
            <div className="timeline">
              <div className="timeline-title">{L.timeline}</div>
              <div className="tl-events">
                {current.events.map((ev, i) => (
                  <div key={i} className="tl-event">
                    <div className="tl-line-wrap">
                      <div className={`tl-dot ${ev.state}`} />
                      {i < current.events.length - 1 && <div className={`tl-connector ${ev.state === 'done' ? 'done' : 'pending'}`} />}
                    </div>
                    <div className="tl-content">
                      <div className={`tl-event-status${ev.state === 'pending' ? ' pending-text' : ''}`}>{ev.status[lang]}</div>
                      <div className="tl-event-loc">{ev.location}</div>
                      {ev.time && <div className="tl-event-time">{ev.time}</div>}
                      {ev.note && <div className="tl-event-note">⚠ {ev.note[lang]}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">{lang==='zh'?'输入AWB号码开始追踪货物':lang==='en'?'Enter an AWB number to track your shipment':'AWB番号を入力して貨物を追跡してください'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
