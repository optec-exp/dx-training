// props 示例：HeroSection 通过 props 接收翻译文字和展览数据
import type { T } from '@/data/translations'

type Props = {
  t: T['hero']
  date: string
  venue: string
}

export default function HeroSection({ t, date, venue }: Props) {
  return (
    <section className="hero" id="top">
      <div className="hero-inner container">
        <p className="hero-eyebrow">{t.eyebrow}</p>
        <h1 className="hero-h1">
          {t.h1[0]}<br />
          <em>{t.h1[1]}</em>
        </h1>
        <p className="hero-desc">{t.desc}</p>
        <div className="hero-meta">
          <span className="meta-chip">📅 {date}</span>
          <span className="meta-chip">📍 {venue}</span>
        </div>
        <div className="hero-btns">
          <a href="#register" className="btn-primary">{t.btn_register}</a>
          <a href="#schedule" className="btn-outline">{t.btn_program}</a>
        </div>
      </div>
    </section>
  )
}
