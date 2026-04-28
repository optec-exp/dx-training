'use client'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import translations from '@/data/translations'

type FormState = {
  name: string; company: string; email: string
  tel: string; service: string; message: string
}
type ErrorState = Partial<Record<keyof FormState, string>>

export default function ContactPage() {
  const { lang } = useLanguage()
  const t = translations[lang].contact
  const f = t.fields

  const [form, setForm] = useState<FormState>({
    name: '', company: '', email: '', tel: '', service: '', message: '',
  })
  const [errors, setErrors] = useState<ErrorState>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: ErrorState = {}
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.name)                newErrors.name    = f.err_name
    if (!emailRe.test(form.email)) newErrors.email   = f.err_email
    if (!form.service)             newErrors.service = f.err_service
    if (form.message.length < 10)  newErrors.message = f.err_message

    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 1000)
  }

  return (
    <div className="contact-page">

      {/* ─── PAGE HERO ─── */}
      <div className="contact-hero">
        <span className="tag-badge">{t.badge}</span>
        <h1>{t.h1[0]}<br/><em>{t.h1[1]}</em></h1>
        <p>{t.hero_p}</p>
      </div>

      {/* ─── DEPARTMENT SECTION ─── */}
      <section className="pic-section">
        <div className="pic-left">
          <p className="sec-lbl">{t.dept_lbl}</p>
          <div className="person-name">{t.dept_name}</div>
          <div className="person-name-en">{t.dept_name_en}</div>
          <div className="person-role">{t.dept_role}</div>
          <p className="person-detail">{t.dept_detail}</p>
        </div>
        <div className="pic-right">
          {t.ci.map((item, i) => (
            <div className="contact-item" key={i}>
              <span className="ci-icon">{item.icon}</span>
              <div>
                <h4>{item.h}</h4>
                <p>
                  {item.p.split('\n').map((line, j) => (
                    <span key={j}>{j > 0 && <br/>}
                      {line.includes('quote@optec-exp.com')
                        ? <a href="mailto:quote@optec-exp.com">{line}</a>
                        : line}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── INFO STRIP ─── */}
      <div className="info-strip">
        {t.info.map((item, i) => (
          <div className="info-cell" key={i}>
            <span className="ic-icon">{item.icon}</span>
            <div>
              <h4>{item.h}</h4>
              <p>{item.p.split('\n').map((line, j) => <span key={j}>{j > 0 && <br/>}{line}</span>)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── INQUIRY FORM ─── */}
      <div className="form-section">
        <h2><em>{t.form_title}</em></h2>

        {submitted ? (
          <div className="toast visible">
            <span>✓</span>
            <span>{f.toast}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">

              <div className="field">
                <label>{f.name} <span className="req">*</span></label>
                <input
                  type="text" name="name" value={form.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : form.name ? 'ok' : ''}
                />
                {errors.name && <span className="err-msg visible">{errors.name}</span>}
              </div>

              <div className="field">
                <label>{f.company}</label>
                <input type="text" name="company" value={form.company} onChange={handleChange}/>
              </div>

              <div className="field">
                <label>{f.email} <span className="req">*</span></label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="example@company.com"
                  className={errors.email ? 'error' : form.email ? 'ok' : ''}
                />
                {errors.email && <span className="err-msg visible">{errors.email}</span>}
              </div>

              <div className="field">
                <label>{f.tel}</label>
                <input type="tel" name="tel" value={form.tel} onChange={handleChange} placeholder="+81 / +86 ..."/>
              </div>

              <div className="field full">
                <label>{f.service} <span className="req">*</span></label>
                <select name="service" value={form.service} onChange={handleChange}
                  className={errors.service ? 'error' : form.service ? 'ok' : ''}>
                  {f.service_opts.map((opt, i) => (
                    <option key={i} value={i === 0 ? '' : opt}>{opt}</option>
                  ))}
                </select>
                {errors.service && <span className="err-msg visible">{errors.service}</span>}
              </div>

              <div className="field full">
                <label>{f.message} <span className="req">*</span></label>
                <textarea
                  name="message" value={form.message} onChange={handleChange}
                  placeholder={f.msg_placeholder}
                  className={errors.message ? 'error' : form.message.length >= 10 ? 'ok' : ''}
                />
                {errors.message && <span className="err-msg visible">{errors.message}</span>}
              </div>

            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              <span>{loading ? f.submitting : f.submit}</span>
              {!loading && <span>→</span>}
            </button>
          </form>
        )}
      </div>

    </div>
  )
}
