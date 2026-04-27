'use client'
import Link from 'next/link'
import { useLang } from '@/context/LangContext'
import translations from '@/data/translations'
import PageHero from '@/components/PageHero'
import StatsBand from '@/components/StatsBand'
import ContactCta from '@/components/ContactCta'

export default function HomePage() {
  const { lang } = useLang()
  const t = translations[lang]

  return (
    <>
      <PageHero
        eyebrow={t.home.eyebrow}
        h1={t.home.h1}
        desc={t.home.desc}
      >
        <div className="hero-btns">
          <a href="#services" className="btn-primary">{t.home.btn_services}</a>
          <a href="#contact" className="btn-outline">{t.home.btn_contact}</a>
        </div>
      </PageHero>

      <StatsBand stats={t.stats} />

      {/* Services */}
      <section id="services" className="section">
        <div className="container">
          <div className="section-header">
            <span className="badge">{t.home.services_badge}</span>
            <h2 className="section-h2">{t.home.services_h2}</h2>
          </div>
          <div className="service-cards">
            {t.services.map((svc, i) => (
              <Link key={i} href={`/${svc.id}`} className="service-card">
                <span className="svc-num">0{i + 1}</span>
                <h3 className="svc-label">{svc.label}</h3>
                <p className="svc-tagline">{svc.tagline}</p>
                <p className="svc-desc">{svc.desc}</p>
                <span className="svc-arrow">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section section-dark">
        <div className="container mission-inner">
          <span className="badge">{t.home.mission_badge}</span>
          <blockquote className="mission-text">"{t.home.mission}"</blockquote>
        </div>
      </section>

      {/* Contact */}
      <div id="contact">
        <ContactCta t={t.contact} />
      </div>

      <footer className="footer">
        <div className="container">{t.footer}</div>
      </footer>
    </>
  )
}
