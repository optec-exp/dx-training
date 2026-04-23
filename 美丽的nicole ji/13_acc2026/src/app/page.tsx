'use client';
import { useState } from 'react';
import { locales, Lang } from '@/data/locales';

const LANGS: { id: Lang; label: string }[] = [
  { id: 'ja', label: '日本語' },
  { id: 'en', label: 'EN' },
  { id: 'zh', label: '中文' },
];

export default function Home() {
  const [lang, setLang] = useState<Lang>('zh');
  const [form, setForm] = useState({ name: '', company: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const t = locales[lang];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '64px', padding: '0 6%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(248,247,244,0.95)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>OP</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)', letterSpacing: '2px' }}>OPTEC EXPRESS</div>
            <div style={{ fontSize: '8px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Urgent Logistics</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '32px' }}>
          {(['overview', 'services', 'contact'] as const).map(key => (
            <a key={key} href={`#${key}`} style={{ fontSize: '12px', fontWeight: 500, color: 'var(--ink-2)', textDecoration: 'none', letterSpacing: '0.5px' }}>
              {t.nav[key]}
            </a>
          ))}
        </nav>

        {/* Language Switcher — useState で言語を切り替える */}
        <div style={{ display: 'flex', background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '20px', padding: '3px', gap: '2px' }}>
          {LANGS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setLang(id)}
              style={{
                padding: '5px 14px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
                background: lang === id ? 'var(--red)' : 'transparent',
                color: lang === id ? '#fff' : 'var(--muted)',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section id="top" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 6%', background: 'linear-gradient(160deg, #1a0a08 0%, #2d1010 40%, #1a0f1f 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '10%', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,57,43,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(184,134,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e74c3c', display: 'inline-block', boxShadow: '0 0 6px #e74c3c' }} />
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#e74c3c', textTransform: 'uppercase' }}>{t.hero.badge}</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: '28px', whiteSpace: 'pre-line' }}>
            {t.hero.title}
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'rgba(255,255,255,0.55)', lineHeight: 2.1, maxWidth: '520px', marginBottom: '44px', whiteSpace: 'pre-line' }}>
            {t.hero.sub}
          </p>

          {/* Booth card */}
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '24px 32px', marginBottom: '44px', backdropFilter: 'blur(8px)' }}>
            {[
              { icon: '📅', text: t.hero.date },
              { icon: '📍', text: t.hero.venue },
              { icon: '🏷', text: t.hero.booth },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ fontSize: '16px' }}>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <a href="#contact" style={{ padding: '13px 30px', background: 'var(--red)', color: '#fff', borderRadius: '7px', fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', textDecoration: 'none', textTransform: 'uppercase' }}>
              {t.hero.cta}
            </a>
            <a href="#overview" style={{ padding: '13px 30px', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: '7px', fontWeight: 500, fontSize: '12px', letterSpacing: '1.5px', textDecoration: 'none', textTransform: 'uppercase' }}>
              {t.hero.ctaSub}
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 6%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
          {t.stats.map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '44px', fontWeight: 700, color: 'var(--red)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '8px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Overview */}
      <section id="overview" style={{ padding: '80px 6%', background: 'var(--bg)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--red)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--red)', textTransform: 'uppercase' }}>Exhibition Info</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: 'var(--ink)', marginBottom: '40px' }}>{t.info.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {t.info.items.map(({ label, value }) => (
              <div key={label} style={{ background: '#fff', borderRadius: '10px', padding: '22px 24px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: '20px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--red)', textTransform: 'uppercase', minWidth: '72px', paddingTop: '2px', fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: '13px', color: 'var(--ink-2)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" style={{ padding: '80px 6%', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--red)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--red)', textTransform: 'uppercase' }}>Our Services</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>{t.services.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '48px' }}>{t.services.sub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {t.services.items.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: '#fff', borderRadius: '12px', padding: '28px 24px', border: '1px solid rgba(0,0,0,0.06)', borderTop: '3px solid var(--red)' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px' }}>{title}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: 1.9 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '80px 6%', background: '#fff' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--red)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--red)', textTransform: 'uppercase' }}>Contact</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>{t.contact.title}</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '48px', whiteSpace: 'pre-line' }}>{t.contact.sub}</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '32px', alignItems: 'start' }}>
            {sent ? (
              <div style={{ background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)', fontWeight: 600 }}>{t.contact.sent}</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'name', placeholder: t.contact.name, type: 'text', required: true },
                  { key: 'company', placeholder: t.contact.company, type: 'text', required: false },
                  { key: 'email', placeholder: t.contact.email, type: 'email', required: true },
                ].map(({ key, placeholder, type, required }) => (
                  <input
                    key={key} type={type} placeholder={placeholder} required={required}
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', padding: '12px 16px', color: 'var(--ink)', fontSize: '13px', outline: 'none' }}
                  />
                ))}
                <textarea
                  placeholder={t.contact.message} rows={4} required
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg)', border: '1px solid rgba(0,0,0,0.12)', borderRadius: '8px', padding: '12px 16px', color: 'var(--ink)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                />
                <button type="submit" style={{ padding: '13px', background: 'var(--red)', color: '#fff', borderRadius: '8px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                  {t.contact.submit}
                </button>
              </form>
            )}

            <div style={{ background: 'rgba(192,57,43,0.05)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--red)', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>● {t.contact.emergency}</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>{t.contact.emergencyNum}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.8 }}>AOG / Pharma / NFO<br />24 / 7 / 365</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--ink)', padding: '32px 6%', textAlign: 'center' }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '3px', marginBottom: '6px' }}>OPTEC EXPRESS</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>{t.footer.tagline}</div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{t.footer.copy}</div>
      </footer>
    </div>
  );
}
