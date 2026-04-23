'use client';
import { useState } from 'react';

const OFFICES = [
  { city: '东京（总部）', en: 'Tokyo HQ', addr: '〒105-0004 東京都港区新橋 2-10-5 新橋原ビル3F', tel: '03-4500-7408' },
  { city: '中国 · 烟台', en: 'Yantai, China', addr: '山東省煙台市芝罘区南大街 888号', tel: '+86-535-1234-5678' },
  { city: '香港', en: 'Hong Kong', addr: 'Unit 12F, Tower A, Landmark North, Sheung Shui', tel: '+852-2345-6789' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', company: '', email: '', type: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '80px 6% 64px', background: 'var(--dark-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '36px', height: '2px', background: 'var(--blue-2)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase' }}>Contact Us</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>
            联系我们 <span style={{ fontSize: '18px', color: 'var(--muted)', fontWeight: 300 }}>Get in Touch</span>
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2, maxWidth: '560px' }}>
            紧急货运请直接拨打24/7热线，一般咨询请填写下方表单，我们将在1个工作日内回复。
          </p>
        </div>
      </section>

      {/* Emergency Banner */}
      <div style={{ background: 'rgba(239,68,68,0.07)', borderTop: '1px solid rgba(239,68,68,0.2)', borderBottom: '1px solid rgba(239,68,68,0.2)', padding: '20px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#fca5a5', textTransform: 'uppercase', fontWeight: 700 }}>● 24/7 紧急热线</span>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 700, color: '#fff' }}>03-4500-1918</span>
          <span style={{ fontSize: '12px', color: 'rgba(252,165,165,0.6)' }}>AOG · 医药品 · 极限时效货物专线</span>
        </div>
      </div>

      {/* Form + Offices */}
      <section style={{ padding: '64px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>

          {/* Form */}
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '32px' }}>
              发送询盘 <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 300 }}>Send Inquiry</span>
            </h2>
            {sent ? (
              <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>✓</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>已成功发送！</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>我们将在1个工作日内与您联系。<br />Thank you, we&apos;ll reply within 1 business day.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {[
                  { key: 'name', label: '姓名 / Name *', type: 'text', placeholder: '您的姓名 · Your name' },
                  { key: 'company', label: '公司 / Company', type: 'text', placeholder: '公司名称（可选）' },
                  { key: 'email', label: '邮箱 / Email *', type: 'email', placeholder: 'example@company.com' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>{label}</label>
                    <input
                      type={type} placeholder={placeholder}
                      required={label.includes('*')}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>咨询类型 / Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '8px', padding: '12px 16px', color: form.type ? '#fff' : 'var(--muted)', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="">请选择 / Select type</option>
                    <option value="aog">AOG 航材紧急运输</option>
                    <option value="pharma">医药品 / 生命科学</option>
                    <option value="nfo">NFO 最速航班</option>
                    <option value="obc">OBC 随身携带</option>
                    <option value="partner">合作洽谈</option>
                    <option value="other">其他 / Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>详细说明 / Message *</label>
                  <textarea
                    placeholder="请描述货物需求、时间要求、目的地等... Describe your cargo, timeline, destination..."
                    required rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <button type="submit" style={{ padding: '14px', background: 'var(--blue)', color: '#fff', borderRadius: '8px', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                  发送 / Send
                </button>
              </form>
            )}
          </div>

          {/* Offices */}
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '32px' }}>
              全球办公室 <span style={{ fontSize: '13px', color: 'var(--muted)', fontWeight: 300 }}>Global Offices</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {OFFICES.map(({ city, en, addr, tel }) => (
                <div key={city} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '22px 24px', border: '1px solid rgba(37,99,235,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--sky)' }}>{city}</span>
                    <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{en}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 2 }}>
                    <div>{addr}</div>
                    <div>TEL: {tel}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '22px 24px', border: '1px solid rgba(37,99,235,0.1)' }}>
              <div style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>一般受付時間 · Office Hours</div>
              <div style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 2 }}>
                <div>月〜金 / Mon–Fri: 09:00–18:00 (JST)</div>
                <div style={{ color: 'rgba(252,165,165,0.7)' }}>緊急専用 / Emergency: 24 / 7 / 365</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
