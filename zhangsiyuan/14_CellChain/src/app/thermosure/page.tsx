'use client'
import { useLang } from '@/context/LangContext'
import translations from '@/data/translations'
import PageHero from '@/components/PageHero'
import FeatureList from '@/components/FeatureList'
import ContactCta from '@/components/ContactCta'

export default function ThermoSurePage() {
  const { lang } = useLang()
  const t = translations[lang]
  const s = t.thermosure

  return (
    <>
      <PageHero
        eyebrow={s.eyebrow}
        h1={s.h1}
        tagline={s.tagline}
        desc={s.desc}
      />

      <section className="section">
        <div className="container">
          <FeatureList features={s.features} />
        </div>
      </section>

      <ContactCta t={t.contact} />

      <footer className="footer">
        <div className="container">{t.footer}</div>
      </footer>
    </>
  )
}
