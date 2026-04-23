'use client';
import { useState } from 'react';
import ServiceTab, { ServiceData } from '@/components/ServiceTab';

const SERVICES: ServiceData[] = [
  {
    id: 'cryo',
    label: '超低温运输',
    accentColor: '#60a5fa',
    tag: 'CryoTransport',
    title: '超低温\n运输服务',
    subtitle: '-196°C ～ -80°C 全程温控',
    desc: '专为细胞治疗产品、干细胞、基因治疗药物设计的超低温运输方案。液氮干燥运输容器，全程数据记录，确保活性完整。',
    badge: 'Cryogenic Transport',
    features: [
      { icon: '🧊', text: '液氮干燥容器，维持 -196°C 至 -80°C' },
      { icon: '📡', text: '全程实时温度监控与数据记录' },
      { icon: '✈', text: 'IATA P650 危险品认证运输' },
      { icon: '🏥', text: '细胞治疗・干细胞・基因药物专用' },
      { icon: '⚡', text: '24/7 紧急调度，最短响应时间' },
    ],
    stats: [
      { num: '-196°C', label: '最低温度' },
      { num: '100%', label: '温控达标率' },
      { num: '24/7', label: '紧急响应' },
      { num: '186', label: '覆盖城市' },
    ],
  },
  {
    id: 'cool',
    label: '冷藏运输',
    accentColor: '#2dd4bf',
    tag: 'CoolChain',
    title: '冷藏温控\n运输服务',
    subtitle: '2–8°C / 15–25°C 精准控温',
    desc: '适用于生物制剂、疫苗、血液制品及普通医药品的冷藏运输。多温区管理，符合 WHO 预认证标准，全程品质可追溯。',
    badge: 'Cold Chain Transport',
    features: [
      { icon: '🌡', text: '2–8°C 及 15–25°C 双温区精准控制' },
      { icon: '💉', text: '疫苗・血液制品・生物制剂专项' },
      { icon: '📊', text: 'WHO PQ 认证温控包装解决方案' },
      { icon: '🔍', text: '全程温湿度数据记录与报告' },
      { icon: '🌐', text: '96 国合作网络，本地冷链衔接' },
    ],
    stats: [
      { num: '2–8°C', label: '冷藏温区' },
      { num: '96国', label: '合作网络' },
      { num: 'WHO', label: 'PQ认证' },
      { num: '10+', label: '年经验' },
    ],
  },
  {
    id: 'comply',
    label: 'GDP 合规',
    accentColor: '#a78bfa',
    tag: 'CompliService',
    title: 'GDP / GMP\n合规服务',
    subtitle: '国际医药物流合规全流程支持',
    desc: '提供符合 EU GDP、PIC/S GMP 标准的医药物流合规服务。从品质协议签订到偏差管理，为制药企业提供完整的监管支持。',
    badge: 'GDP Compliance',
    features: [
      { icon: '📋', text: 'EU GDP / PIC·S GMP 标准合规' },
      { icon: '🤝', text: '品质协议（Quality Agreement）签订' },
      { icon: '⚠️', text: '温度偏差即时报告与纠正措施' },
      { icon: '📁', text: '进出口许可证・通关文件一站式管理' },
      { icon: '🔐', text: '供应链安全管理・防伪验证支持' },
    ],
    stats: [
      { num: 'EU GDP', label: '认证标准' },
      { num: 'ISO', label: '9001:2015' },
      { num: '<1h', label: '偏差响应' },
      { num: '全程', label: '文件追溯' },
    ],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('cryo');
  const activeService = SERVICES.find(s => s.id === activeTab)!;

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', background: 'rgba(6,12,20,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(59,130,246,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🧬</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>CellChain</div>
            <div style={{ fontSize: '9px', color: 'var(--muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>Logistics by OPTEC</div>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '32px' }}>
          {['services', 'about', 'contact'].map(item => (
            <a key={item} href={`#${item}`} style={{ fontSize: '11px', letterSpacing: '1px', color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
              {item === 'services' ? '服务' : item === 'about' ? '关于' : '联系'}
            </a>
          ))}
        </nav>
        <a href="#contact" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: '#fff', textDecoration: 'none', textTransform: 'uppercase' }}>
          联系我们
        </a>
      </header>

      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 6% 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 30% 50%, rgba(59,130,246,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 40% at 80% 60%, rgba(6,182,212,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '20px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#60a5fa', textTransform: 'uppercase' }}>Medical Logistics Specialist</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 600, color: '#fff', lineHeight: 1.1, marginBottom: '24px' }}>
            生命を運ぶ、<br />
            <em style={{ color: 'var(--cell-cyan)', fontStyle: 'italic' }}>温度で守る。</em>
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.1, maxWidth: '520px', marginBottom: '48px' }}>
            CellChain Logistics は OPTEC Express の医薬品・ライフサイエンス専門部門。超低温から冷藏、GDP合規まで、医药品冷链物流のすべてをカバーします。
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <a href="#services" style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              查看服务
            </a>
            <a href="#contact" style={{ padding: '14px 32px', border: '1px solid rgba(59,130,246,0.35)', color: '#60a5fa', borderRadius: '6px', fontWeight: 500, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              联系我们
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(59,130,246,0.08)', borderBottom: '1px solid rgba(59,130,246,0.08)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 6%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
          {[
            { num: '-196°C', label: '最低运输温度' },
            { num: '100%', label: 'GDP 合规率' },
            { num: '186', label: '覆盖城市' },
            { num: '24/7', label: '紧急响应' },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: 'var(--cell-blue)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '8px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services with Tabs */}
      <section id="services" style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--cell-blue)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--cell-blue)', display: 'inline-block' }} />
            Our Services
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>三大核心服务</h2>

          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: '0', background: 'var(--dark-2)', borderRadius: '12px', padding: '6px', border: '1px solid rgba(59,130,246,0.1)', marginBottom: '56px', width: 'fit-content' }}>
            {SERVICES.map(({ id, label, accentColor }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  padding: '12px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, letterSpacing: '0.5px',
                  background: activeTab === id ? accentColor : 'transparent',
                  color: activeTab === id ? '#fff' : 'var(--muted)',
                  transition: 'all 0.25s',
                  boxShadow: activeTab === id ? `0 4px 16px ${accentColor}40` : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <ServiceTab key={activeTab} service={activeService} />
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '0 6% 80px', background: 'var(--dark-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '80px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>关于 CellChain</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {[
              { icon: '🏆', title: 'ISO 9001:2015 认证', desc: '由 SGS 颁发，品质管理体系国际认可，确保每一票货物符合最高标准。' },
              { icon: '🌐', title: 'OPTEC 全球网络', desc: '依托 OPTEC Express 96 国代理网络，实现全球医药物流无缝衔接。' },
              { icon: '⚡', title: '24/7 专属团队', desc: '医药物流专属协调员全天候待命，紧急情况即时响应处理。' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '32px 28px', border: '1px solid rgba(59,130,246,0.08)', borderTop: '2px solid rgba(59,130,246,0.3)' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>{title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '80px 6%', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>开始合作</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '36px' }}>
            无论是超低温运输方案还是 GDP 合规咨询，我们的医药物流专家随时准备为您服务。
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="mailto:info@optec-exp.com" style={{ padding: '14px 32px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', color: '#fff', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              发送邮件
            </a>
            <div style={{ padding: '14px 32px', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
              📞 03-4500-7408
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(59,130,246,0.08)', padding: '32px 6%', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cell-blue)', letterSpacing: '2px', marginBottom: '6px' }}>CELLCHAIN LOGISTICS</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>by OPTEC Express Co., Ltd.</div>
        <div style={{ fontSize: '11px', color: 'rgba(200,220,255,0.2)' }}>© 2026 OPTEC Express. All rights reserved.</div>
      </footer>
    </div>
  );
}
