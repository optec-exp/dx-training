'use client';
import { useState } from 'react';
import ServiceTab from '@/components/ServiceTab';
import { SERVICES } from '@/data/services';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('cryo');
  const activeService = SERVICES.find(s => s.id === activeTab)!;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', padding: '0 6%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(3,14,10,0.9)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(16,185,129,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #10b981, #2dd4bf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🧬</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', letterSpacing: '1.5px' }}>CellChain</div>
            <div style={{ fontSize: '8px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Logistics by OPTEC Express</div>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '32px' }}>
          {[
            { href: '#services', label: '服务' },
            { href: '#about', label: '关于' },
            { href: '#contact', label: '联系' },
          ].map(({ href, label }) => (
            <a key={href} href={href} style={{ fontSize: '12px', letterSpacing: '1px', color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
              {label}
            </a>
          ))}
        </nav>

        <a href="#contact" style={{ padding: '9px 22px', background: 'linear-gradient(135deg, #10b981, #2dd4bf)', color: '#fff', borderRadius: '7px', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textDecoration: 'none', textTransform: 'uppercase' }}>
          咨询
        </a>
      </header>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 6% 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 50% at 25% 55%, rgba(16,185,129,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 45% 35% at 80% 45%, rgba(45,212,191,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--green)', textTransform: 'uppercase' }}>Medical Logistics Specialist</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(42px, 6vw, 80px)', fontWeight: 600, color: '#fff', lineHeight: 1.1, marginBottom: '24px' }}>
            温度が、<br />
            <em style={{ color: 'var(--green-2)', fontStyle: 'italic' }}>命を守る。</em>
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.1, maxWidth: '520px', marginBottom: '20px' }}>
            CellChain Logistics は OPTEC Express の医薬品・ライフサイエンス専門部門。
          </p>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(187,218,200,0.5)', lineHeight: 2, maxWidth: '500px', marginBottom: '48px' }}>
            超低温から冷藏、GDP合规まで——生命に関わる貨物の国際輸送をすべてカバーします。
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <a href="#services" style={{ padding: '14px 34px', background: 'linear-gradient(135deg, #10b981, #2dd4bf)', color: '#fff', borderRadius: '7px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              查看服务
            </a>
            <a href="#contact" style={{ padding: '14px 34px', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--green-2)', borderRadius: '7px', fontWeight: 500, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              联系我们
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div style={{ background: 'var(--bg-2)', borderTop: '1px solid rgba(16,185,129,0.08)', borderBottom: '1px solid rgba(16,185,129,0.08)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 6%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
          {[
            { num: '-196°C', label: '最低运输温度' },
            { num: '100%', label: 'GDP 合规率' },
            { num: '186', label: '覆盖城市' },
            { num: '24/7', label: '紧急响应' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '34px', fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '8px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services with Tab switching — useState で管理 */}
      <section id="services" style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--green)', textTransform: 'uppercase' }}>Our Services</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>三大核心服务</h2>

          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: '0', background: 'var(--bg-2)', borderRadius: '12px', padding: '6px', border: '1px solid rgba(16,185,129,0.1)', marginBottom: '56px', width: 'fit-content' }}>
            {SERVICES.map(({ id, tabLabel, accent }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  padding: '11px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px',
                  background: activeTab === id ? accent : 'transparent',
                  color: activeTab === id ? '#fff' : 'var(--muted)',
                  boxShadow: activeTab === id ? `0 4px 14px ${accent}40` : 'none',
                  transition: 'all 0.25s',
                }}
              >
                {tabLabel}
              </button>
            ))}
          </div>

          {/* ServiceTab component — props で service データを渡す。3回再利用 */}
          <ServiceTab key={activeTab} service={activeService} />
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '80px 6%', background: 'var(--bg-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>关于 CellChain</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '40px' }}>About CellChain Logistics</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {[
              { icon: '🏆', title: 'ISO 9001:2015', desc: 'SGS 认证，品质管理体系国际标准，确保每一票货物符合最严苛要求。' },
              { icon: '🌐', title: 'OPTEC 全球网络', desc: '依托 OPTEC Express 96国代理网络，实现全球医药物流无缝衔接。' },
              { icon: '⚡', title: '24/7 专属团队', desc: '医药物流专属协调员全天候待命，紧急情况即时响应，ATA级响应速度。' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg-3)', borderRadius: '14px', padding: '32px 28px', border: '1px solid rgba(16,185,129,0.1)', borderTop: '2px solid rgba(16,185,129,0.3)' }}>
                <div style={{ fontSize: '30px', marginBottom: '16px' }}>{icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>{title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '80px 6%', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '28px', height: '2px', background: 'var(--green)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--green)', textTransform: 'uppercase' }}>Contact</span>
            <span style={{ width: '28px', height: '2px', background: 'var(--green)', display: 'inline-block' }} />
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>开始合作</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '36px' }}>
            超低温运输、冷藏方案还是GDP合规咨询——<br />我们的医药物流专家随时准备为您服务。
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:info@optec-exp.com" style={{ padding: '13px 32px', background: 'linear-gradient(135deg, #10b981, #2dd4bf)', color: '#fff', borderRadius: '7px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              发送邮件
            </a>
            <div style={{ padding: '13px 28px', border: '1px solid rgba(16,185,129,0.25)', color: 'var(--green-2)', borderRadius: '7px', fontSize: '13px', fontWeight: 600 }}>
              📞 03-4500-7408
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-2)', borderTop: '1px solid rgba(16,185,129,0.08)', padding: '32px 6%', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green)', letterSpacing: '2px', marginBottom: '6px' }}>CELLCHAIN LOGISTICS</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>by OPTEC Express Co., Ltd.</div>
        <div style={{ fontSize: '11px', color: 'rgba(187,218,200,0.2)' }}>© 2026 OPTEC Express. All rights reserved.</div>
      </footer>
    </div>
  );
}
