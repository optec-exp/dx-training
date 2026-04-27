// props 示例：RegisterCta 通过 props 接收翻译文字
import type { T } from '@/data/translations'

type Props = {
  t: T['register']
}

export default function RegisterCta({ t }: Props) {
  return (
    <section id="register" className="section register-section">
      <div className="container register-inner">
        <span className="badge badge-light">{t.badge}</span>
        <h2 className="register-h2">{t.h2}</h2>
        <p className="register-desc">{t.desc}</p>
        <div className="register-btns">
          <a href="https://www.transportlogistic-china.com/air-cargo-china" target="_blank" rel="noopener" className="btn-white">
            {t.btn_visitor}
          </a>
          <a href="https://www.transportlogistic-china.com/air-cargo-china" target="_blank" rel="noopener" className="btn-outline-light">
            {t.btn_exhibitor}
          </a>
        </div>
      </div>
    </section>
  )
}
