import Link from 'next/link';

const PLANS = [
  {
    en: 'Standard Air', zh: '标准航空运输', price: '按重量计费',
    color: '#60a5fa',
    features: ['次日起飞', '全球主要航线覆盖', '在线实时追踪', '标准文件处理'],
    desc: '适合时效要求较高但有一定弹性的货物，兼顾成本与速度。',
  },
  {
    en: 'Next Flight Out', zh: 'NFO 最速航班', price: '优先定价',
    color: '#2563eb', best: true,
    features: ['当日 / 翌日出发', '优先装载 · 机上优先', '24/7 专属协调员', '全程节点追踪', '文件一站式处理'],
    desc: '下一班最快航班即刻出发，AOG航材与医药品首选方案。',
  },
  {
    en: 'On Board Courier', zh: 'OBC 随身携带', price: '专项报价',
    color: '#a78bfa',
    features: ['专属信使全程随行', '手提行李运输', '零过境等待时间', '最高安全与保密级别'],
    desc: '极端时效场景的终极选择，信使以手提行李形式护送货物全程。',
  },
];

const DOMAINS = [
  {
    icon: '✈', title: 'AOG 航材运输', en: 'Aircraft on Ground',
    items: ['备用零件全球24/7调配', '航空公司直接协调联络', '通关加急处理', 'CASS账单结算支持'],
  },
  {
    icon: '🧬', title: '医药品 & 生命科学', en: 'Pharma & Life Science',
    items: ['CellChain全程温控', 'GDP / GMP合规管理', '冷链包装方案', '温度偏差即时报告'],
  },
  {
    icon: '⚠️', title: '危险品运输', en: 'Dangerous Goods',
    items: ['IATA DGR认证操作', '包装 · 标识 · 申告', '航空公司申报协调', '全程安全文件管理'],
  },
  {
    icon: '🔬', title: '精密仪器 & 展品', en: 'Instruments & Exhibits',
    items: ['专业木箱定制包装', 'ATA单证册代理办理', '展会现场精准交付', '货物保险安排支持'],
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ padding: '80px 6% 64px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 60% 50%, rgba(37,99,235,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '36px', height: '2px', background: 'var(--blue-2)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase' }}>Services</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>
            服务介绍 <span style={{ fontSize: '18px', color: 'var(--muted)', fontWeight: 300 }}>Our Services</span>
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2, maxWidth: '600px' }}>
            从标准航空到随身携带，OPTEC Express 提供覆盖全场景的国际紧急物流方案，确保每一票货物以最快速度安全送达。
          </p>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '36px', height: '2px', background: 'var(--blue-2)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase' }}>Service Plans</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>运输方案</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', alignItems: 'start' }}>
            {PLANS.map(({ en, zh, price, color, best, features, desc }) => (
              <div key={zh} style={{
                background: 'var(--dark-3)', borderRadius: '14px', padding: '36px 28px',
                border: best ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.06)',
                borderTop: `3px solid ${color}`,
                position: 'relative',
              }}>
                {best && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: 'var(--blue)', color: '#fff', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', padding: '4px 18px', borderRadius: '20px' }}>
                    推荐 / BEST
                  </div>
                )}
                <div style={{ fontSize: '10px', letterSpacing: '2px', color, textTransform: 'uppercase', marginBottom: '8px' }}>{en}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{zh}</div>
                <div style={{ fontSize: '13px', color, fontWeight: 500, marginBottom: '16px' }}>{price}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, marginBottom: '24px' }}>{desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px', color: 'rgba(226,232,240,0.75)' }}>
                      <span style={{ color, fontSize: '13px', flexShrink: 0 }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domains */}
      <section style={{ padding: '0 6% 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>专项运输领域</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '40px' }}>Specialized Cargo Domains</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {DOMAINS.map(({ icon, title, en, items }) => (
              <div key={title} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '28px 22px', border: '1px solid rgba(37,99,235,0.1)' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '10px', color: 'var(--sky)', letterSpacing: '1px', marginBottom: '16px', textTransform: 'uppercase' }}>{en}</div>
                {items.map(item => (
                  <div key={item} style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', paddingLeft: '10px', borderLeft: '2px solid rgba(37,99,235,0.25)' }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div style={{ padding: '60px 6%', background: 'var(--dark-2)', textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>需要定制方案或即时报价？</p>
        <Link href="/contact" style={{ display: 'inline-block', padding: '14px 40px', background: 'var(--blue)', color: '#fff', borderRadius: '7px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
          联系我们 / Contact Us
        </Link>
      </div>
    </>
  );
}
