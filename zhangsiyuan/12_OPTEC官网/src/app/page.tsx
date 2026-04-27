'use client'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import translations from '@/data/translations'

const WorldMap = dynamic(() => import('@/components/WorldMapInner'), { ssr: false })

export default function HomePage() {
  const { lang } = useLanguage()
  const t = translations[lang].home

  return (
    <div style={{ paddingTop: '80px' }}>

      {/* ─── HERO ─── */}
      <section className="home-hero">
        <div className="home-hero-left">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>
            {t.h1[0]}<br/>
            {t.h1[1]}<br/>
            <em>{t.h1[2]}</em>
          </h1>
          <p className="lead">{t.lead}</p>
          <div className="hero-btns">
            <Link href="/services" className="btn-primary">{t.btn_services}</Link>
            <Link href="/about" className="btn-outline">{t.btn_about}</Link>
          </div>
        </div>
        <div className="home-hero-right">
          <div className="hero-grid-bg" />
          <div className="world-map-wrapper">
            <WorldMap />
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <div className="stats-row">
        <div className="stat"><div className="stat-n">96</div><div className="stat-l">{t.stats[0]}</div></div>
        <div className="stat"><div className="stat-n">10<span style={{ fontSize: '1.4rem' }}>+</span></div><div className="stat-l">{t.stats[1]}</div></div>
        <div className="stat"><div className="stat-n">7</div><div className="stat-l">{t.stats[2]}</div></div>
        <div className="stat"><div className="stat-n">24/7</div><div className="stat-l">{t.stats[3]}</div></div>
      </div>

      {/* ─── SECTION CARDS ─── */}
      <div className="section-cards">
        <Link href="/about" className="sec-card">
          <div className="sc-num">01</div>
          <span className="sc-icon">🏢</span>
          <div className="sc-title">{t.card_about.title}</div>
          <p className="sc-desc">{t.card_about.desc}</p>
        </Link>
        <Link href="/services" className="sec-card">
          <div className="sc-num">02</div>
          <span className="sc-icon">✈</span>
          <div className="sc-title">{t.card_services.title}</div>
          <p className="sc-desc">{t.card_services.desc}</p>
        </Link>
        <Link href="/contact" className="sec-card">
          <div className="sc-num">03</div>
          <span className="sc-icon">💬</span>
          <div className="sc-title">{t.card_contact.title}</div>
          <p className="sc-desc">{t.card_contact.desc}</p>
        </Link>
      </div>

      {/* ─── ABOUT TEASER ─── */}
      <section className="about-teaser">
        <div className="at-left">
          <p className="sec-lbl">{t.teaser_lbl}</p>
          <h2>
            {t.teaser_h2.split('\n').map((line, i) => (
              <span key={i}>{i > 0 && <br/>}{line}</span>
            ))}
          </h2>
          <p>{t.teaser_p}</p>
          <Link href="/about" className="cta-link">{t.teaser_cta}</Link>
        </div>
        <div className="at-right">
          {t.kv.map((item, i) => (
            <div className="kv" key={i}>
              <span className="kv-icon">{item.icon}</span>
              <div><h4>{item.h}</h4><p>{item.p}</p></div>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
