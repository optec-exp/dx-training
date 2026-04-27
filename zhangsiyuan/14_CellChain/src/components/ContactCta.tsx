// 组件复用示例：ContactCta 在首页和三个服务页面上复用，通过 props 接收翻译文字
import type { T } from '@/data/translations'

type Props = {
  t: T['contact']
}

export default function ContactCta({ t }: Props) {
  return (
    <section className="contact-cta">
      <div className="container cta-inner">
        <span className="badge">{t.badge}</span>
        <h2 className="cta-h2">{t.h2}</h2>
        <p className="cta-desc">{t.desc}</p>
        <div className="cta-actions">
          <a href={`mailto:${t.email}`} className="btn-ice">{t.btn}</a>
          <div className="cta-tel">
            <span className="tel-label">{t.tel_label}</span>
            <a href={`tel:${t.tel.replace(/-/g, '')}`} className="tel-num">{t.tel}</a>
          </div>
        </div>
      </div>
    </section>
  )
}
