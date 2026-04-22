'use client';
import { useState } from 'react';

const OFFICES = [
  { city: '东京（总部）', addr: '〒105-0004 東京都港区新橋 2-10-5 新橋原ビル3F', tel: '03-4500-7408', emergency: '03-4500-1918' },
  { city: '中国・烟台', addr: '山東省煙台市芝罘区南大街 888号', tel: '+86-535-1234-5678', emergency: '+86-135-0000-0000' },
  { city: '香港', addr: 'Unit 12F, Tower A, Landmark North, Sheung Shui', tel: '+852-2345-6789', emergency: '+852-9000-0000' },
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
      <section style={{ padding: '80px 6% 60px', background: 'var(--dark-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            Contact Us
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>联系我们</h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2 }}>
            紧急货运咨询请通过24/7热线联系。一般咨询与合作洽谈请填写下方表单，我们将在1个工作日内回复。
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ padding: '64px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>

          {/* Form */}
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '32px' }}>发送询盘</h2>
            {sent ? (
              <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>✓</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>已成功发送！</div>
                <div style={{ fontSize: '13px', color: 'var(--muted)' }}>我们将在1个工作日内与您联系。</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { key: 'name', label: '姓名 *', type: 'text', placeholder: '您的姓名' },
                  { key: 'company', label: '公司名称', type: 'text', placeholder: '所属公司（可选）' },
                  { key: 'email', label: '邮箱地址 *', type: 'email', placeholder: 'example@company.com' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>{label}</label>
                    <input
                      type={type} placeholder={placeholder}
                      required={label.includes('*')}
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>咨询类型</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', color: form.type ? '#fff' : 'rgba(232,232,240,0.4)', fontSize: '13px', outline: 'none' }}
                  >
                    <option value="">请选择</option>
                    <option value="aog">AOG 航材紧急运输</option>
                    <option value="pharma">医药品 / 生命科学</option>
                    <option value="nfo">NFO 最速航班</option>
                    <option value="obc">OBC 随身携带</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>详细说明 *</label>
                  <textarea
                    placeholder="请描述您的货物需求、时间要求、目的地等..." required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    style={{ width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '12px 16px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <button type="submit" style={{ padding: '14px', background: 'var(--gold)', color: '#08080f', borderRadius: '8px', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
                  发送询盘
                </button>
              </form>
            )}
          </div>

          {/* Offices + Emergency */}
          <div>
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '24px 28px', marginBottom: '32px' }}>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: '#fca5a5', textTransform: 'uppercase', marginBottom: '10px' }}>● 24/7 紧急热线</div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '28px', fontWeight: 600, color: '#fff', marginBottom: '6px' }}>03-4500-1918</div>
              <div style={{ fontSize: '12px', color: 'rgba(232,232,240,0.5)' }}>AOG / 医药品 / 时效紧急货物专线</div>
            </div>

            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 600, color: '#fff', marginBottom: '24px' }}>全球办公室</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {OFFICES.map(({ city, addr, tel, emergency }) => (
                <div key={city} style={{ background: 'var(--dark-3)', borderRadius: '10px', padding: '20px 22px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--gold)', marginBottom: '8px' }}>{city}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.9 }}>
                    <div>{addr}</div>
                    <div>TEL: {tel}</div>
                    <div>紧急: {emergency}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
