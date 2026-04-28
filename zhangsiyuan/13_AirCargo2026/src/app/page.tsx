'use client'
// useState 示例：页面级语言状态，通过 props 向下传递给所有子组件
import { useState } from 'react'
import translations, { type Lang } from '@/data/translations'
import exhibition from '@/data/exhibition.json'
import LangSwitcher from '@/components/LangSwitcher'
import HeroSection from '@/components/HeroSection'
import StatsBar from '@/components/StatsBar'
import SegmentCard from '@/components/SegmentCard'
import FaqItem from '@/components/FaqItem'
import RegisterCta from '@/components/RegisterCta'
import SupportWidget from '@/components/SupportWidget'

export default function Page() {
  const [lang, setLang] = useState<Lang>('zh')
  const t = translations[lang]
  const date = exhibition.dates.display[lang]
  const venue = exhibition.venue.name[lang]

  return (
    <>
      {/* ── Nav ── */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="#top" className="nav-logo">
            <span className="logo-main">Air Cargo China</span>
            <span className="logo-sub">Transport Logistic China 2026</span>
          </a>
          <div className="nav-links">
            <a href="#about">{t.nav.about}</a>
            <a href="#segments">{t.nav.segments}</a>
            <a href="#schedule">{t.nav.schedule}</a>
            <a href="#faq">{t.nav.faq}</a>
            <a href="#register" className="nav-cta">{t.nav.register}</a>
          </div>
          <LangSwitcher lang={lang} setLang={setLang} labels={t.lang_label} />
        </div>
      </nav>

      {/* ── Hero ── */}
      <HeroSection t={t.hero} date={date} venue={venue} />

      {/* ── Stats Bar ── */}
      <StatsBar stats={t.stats} />

      {/* ── About ── */}
      <section id="about" className="section">
        <div className="container">
          <div className="about-grid">
            <div>
              <span className="badge">{t.about.badge}</span>
              <h2 className="section-h2">{t.about.h2}</h2>
              <p className="about-desc">{t.about.desc}</p>
            </div>
            <div className="about-visual">✈️</div>
          </div>
        </div>
      </section>

      {/* ── Segments ── */}
      <section id="segments" className="section section-gray">
        <div className="container">
          <div className="segments-h">
            <span className="badge">{t.nav.segments}</span>
            <h2 className="section-h2">{
              lang === 'ja' ? '展示区カテゴリー' :
              lang === 'zh' ? '展区介绍' :
              'Exhibition Segments'
            }</h2>
          </div>
          <div className="segments-grid">
            {t.segments.map((seg, i) => (
              <SegmentCard
                key={i}
                icon={exhibition.segments[i].icon}
                title={seg.title}
                desc={seg.desc}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Attend ── */}
      <section className="section">
        <div className="container">
          <div className="why-h">
            <h2 className="section-h2">{
              lang === 'ja' ? '参加する理由' :
              lang === 'zh' ? '为什么参加' :
              'Why Attend'
            }</h2>
          </div>
          <div className="why-grid">
            {t.why.map((item, i) => (
              <div key={i} className="why-card">
                <div className="why-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Schedule ── */}
      <section id="schedule" className="section section-gray">
        <div className="container">
          <div className="schedule-h">
            <span className="badge">{t.schedule.badge}</span>
            <h2 className="section-h2">{t.schedule.h2}</h2>
          </div>
          <div className="schedule-grid">
            {t.schedule.days.map((day, i) => (
              <div key={i} className="schedule-card">
                <div className="schedule-date">{exhibition.schedule[i].date[lang]}</div>
                <h3 className="schedule-title">{day.title}</h3>
                <ul className="session-list">
                  {day.sessions.map((s, j) => <li key={j}>{s}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="section">
        <div className="container">
          <div className="faq-h">
            <span className="badge">{t.nav.faq}</span>
            <h2 className="section-h2">FAQ</h2>
          </div>
          <div className="faq-list">
            {t.faq.map((item, i) => (
              <FaqItem key={`${lang}-${i}`} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Register CTA ── */}
      <RegisterCta t={t.register} />

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="container">{t.footer}</div>
      </footer>

      {/* ── Support Widget (floating) ── */}
      <SupportWidget t={t.support} />
    </>
  )
}
