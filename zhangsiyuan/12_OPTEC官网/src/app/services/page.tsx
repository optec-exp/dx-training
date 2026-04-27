'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import translations from '@/data/translations'

export default function ServicesPage() {
  const { lang } = useLanguage()
  const t = translations[lang].services

  const [activeFilter, setActiveFilter] = useState('all')

  const visible = t.items.filter(
    (s) => activeFilter === 'all' || s.id === activeFilter
  )

  const FILTER_BTNS = [
    { key: 'all',      label: t.filter_all },
    { key: 'air',      label: t.filter_labels.air },
    { key: 'sea',      label: t.filter_labels.sea },
    { key: 'pharma',   label: t.filter_labels.pharma },
    { key: 'expo',     label: t.filter_labels.expo },
    { key: 'solution', label: t.filter_labels.solution },
  ]

  const NOS = ['01 / 05', '02 / 05', '03 / 05', '04 / 05', '05 / 05']

  return (
    <div className="services-page">

      {/* ─── PAGE HERO ─── */}
      <div className="page-hero">
        <p className="sec-lbl">{t.lbl}</p>
        <h1>
          {t.h1[0]}<br/>
          <em>{t.h1[1]}</em>
        </h1>
        <p>{t.lead}</p>
      </div>

      {/* ─── FILTER BAR ─── */}
      <div className="filter-bar">
        <span className="filter-label">Filter</span>
        {FILTER_BTNS.map((btn) => (
          <button
            key={btn.key}
            className={`f-btn${activeFilter === btn.key ? ' on' : ''}`}
            onClick={() => setActiveFilter(btn.key)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* ─── SERVICE CARDS ─── */}
      <div className="svc-section">
        <div className="svc-grid">
          {visible.map((svc) => (
            <div
              key={svc.id}
              className={`svc-card${svc.id === 'solution' && visible.length === 1 ? ' span-full' : ''}`}
            >
              <div className="svc-no">{NOS[t.items.findIndex(x => x.id === svc.id)]}</div>
              <span className="svc-icon">{svc.icon}</span>
              <h2>{svc.title}</h2>
              <div className="svc-sub">{svc.sub}</div>
              <p>{svc.desc}</p>
              <div className="svc-tags">
                {svc.tags.map((tag) => (
                  <span key={tag} className="svc-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA BAND ─── */}
      <div className="cta-band">
        <div>
          <h3>{t.cta_h}</h3>
          <p>{t.cta_p}</p>
        </div>
        <Link href="/contact" className="cta-btn">{t.cta_btn}</Link>
      </div>

    </div>
  )
}
