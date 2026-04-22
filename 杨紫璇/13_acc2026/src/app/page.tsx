'use client';
import { useState } from 'react';
import { locales, Lang } from '@/locales';

export default function Home() {
  const [lang, setLang] = useState<Lang>('ja');
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const t = locales[lang];

  const LANGS: Lang[] = ['ja', 'en', 'zh'];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', background: 'rgba(8,8,15,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px' }}>OPTEC</span>
          <span style={{ fontSize: '10px', color: 'rgba(232,232,240,0.4)', letterSpacing: '1px' }}>EXPRESS</span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {(['exhibition', 'showcase', 'contact'] as const).map(key => (
            <a key={key} href={`#${key}`} style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
              {t.nav[key]}
            </a>
          ))}
        </nav>

        {/* Language Switcher */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--dark-3)', borderRadius: '20px', padding: '4px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {LANGS.map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: '5px 14px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
                background: lang === l ? 'var(--gold)' : 'transparent',
                color: lang === l ? '#08080f' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              {locales[l].langLabel}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '120px 6% 80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(201,169,110,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20%', right: '8%', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.25)', borderRadius: '20px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase' }}>{t.hero.badge}</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 600, color: '#fff', lineHeight: 1.1, marginBottom: '28px', whiteSpace: 'pre-line' }}>
            {t.hero.title}
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2, maxWidth: '540px', marginBottom: '48px', whiteSpace: 'pre-line' }}>
            {t.hero.subtitle}
          </p>

          {/* Booth info card */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '12px', background: 'var(--dark-2)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '14px', padding: '24px 32px', marginBottom: '40px' }}>
            {[
              { icon: '📅', text: t.hero.date },
              { icon: '📍', text: t.hero.venue },
              { icon: '🏷', text: t.hero.booth },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#e8e8f0' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <a href="#contact" style={{ padding: '14px 32px', background: 'var(--gold)', color: '#08080f', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              {t.hero.cta}
            </a>
            <a href="#showcase" style={{ padding: '14px 32px', border: '1px solid rgba(201,169,110,0.35)', color: 'var(--gold)', borderRadius: '6px', fontWeight: 500, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              {t.hero.ctaSub}
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 6%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
          {t.stats.map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '8px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Exhibition Info */}
      <section id="exhibition" style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            {t.info.sectionLabel}
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>{t.info.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '16px' }}>
            {t.info.items.map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '24px 28px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--gold)', textTransform: 'uppercase', minWidth: '80px', paddingTop: '2px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#e8e8f0', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" style={{ padding: '0 6% 80px', background: 'var(--dark-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '80px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            {t.showcase.sectionLabel}
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>{t.showcase.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '48px', maxWidth: '600px' }}>{t.showcase.subtitle}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {t.showcase.items.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '32px 28px', border: '1px solid rgba(255,255,255,0.05)', borderTop: '2px solid rgba(201,169,110,0.3)' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>{title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            {t.contact.sectionLabel}
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>{t.contact.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '40px', whiteSpace: 'pre-line' }}>{t.contact.subtitle}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px', alignItems: 'start' }}>
            {sent ? (
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>✓</div>
                <div style={{ fontSize: '14px', color: '#fff' }}>{t.contact.sent}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {([
                  { key: 'name', placeholder: t.contact.namePlaceholder, type: 'text' },
                  { key: 'company', placeholder: t.contact.companyPlaceholder, type: 'text' },
                  { key: 'email', placeholder: t.contact.emailPlaceholder, type: 'email' },
                ] as const).map(({ key, placeholder, type }) => (
                  <input
                    key={key}
                    type={type}
                    placeholder={placeholder}
                    required={key !== 'company'}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '13px', outline: 'none' }}
                  />
                ))}
                <textarea
                  placeholder={t.contact.messagePlaceholder}
                  rows={4}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
                <button type="submit" style={{ padding: '14px', background: 'var(--gold)', color: '#08080f', borderRadius: '8px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                  {t.contact.submit}
                </button>
              </form>
            )}

            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '24px 28px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#fca5a5', textTransform: 'uppercase', marginBottom: '10px' }}>● {t.contact.emergency}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>{t.contact.emergencyNum}</div>
              <div style={{ fontSize: '11px', color: 'rgba(232,232,240,0.4)', lineHeight: 1.8 }}>AOG / Pharma / NFO<br />24 / 7 / 365</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '32px 6%', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '16px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '3px', marginBottom: '8px' }}>OPTEC EXPRESS</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>{t.footer.tagline}</div>
        <div style={{ fontSize: '11px', color: 'rgba(232,232,240,0.25)' }}>{t.footer.copy}</div>
      </footer>
    </div>
  );
}
