const PLANS = [
  {
    name: '普通航空', en: 'Standard Air', price: '按重量计',
    color: '#60a5fa',
    features: ['次日起飞', '全球主要航线', '电子追踪', '基础文件支持'],
    desc: '适合有一定时间余量、追求性价比的紧急货物运输。',
  },
  {
    name: 'NFO 最速', en: 'Next Flight Out', price: '优先定价',
    color: 'var(--gold)', best: true,
    features: ['当日/次日出发', '优先装载', '24/7专属协调员', '全程追踪', '文件全包'],
    desc: '下一班最快航班，适合AOG、医药品等对时效要求极高的货物。',
  },
  {
    name: 'OBC 随身携带', en: 'On Board Courier', price: '专项报价',
    color: '#a78bfa',
    features: ['信使全程随行', '手提行李运输', '零过境等待', '最高安全等级'],
    desc: '专属信使随行，最高速度与安全性，适合极端紧急场景。',
  },
];

const DOMAINS = [
  { title: 'AOG 航材运输', icon: '✈', items: ['备用零件全球调配', '航空公司直接协调', '通关加急处理', 'CASS账单结算'] },
  { title: '医药品 & 生科', icon: '🧬', items: ['全程温控链管理', 'GDP / GMP合规', 'CellChain专属网络', '品质偏差即时报告'] },
  { title: '危险品运输', icon: '⚠️', items: ['IATA DGR认证', '包装・标识・申告', '航空公司协调', '全程文件管理'] },
  { title: '精密仪器 & 展品', icon: '🔬', items: ['木箱包装专项', 'ATA Carnet办理', '展会现场交付', '保险安排支持'] },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ padding: '80px 6% 60px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(201,169,110,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            Services
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 600, color: '#fff', marginBottom: '20px' }}>服务介绍</h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2, maxWidth: '560px' }}>
            从标准航空到随身携带，从航材到医药品——OPTEC Express 提供覆盖全场景的国际紧急物流解决方案。
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            Service Plans
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>运输方案</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', alignItems: 'start' }}>
            {PLANS.map(({ name, en, price, color, best, features, desc }) => (
              <div key={name} style={{
                background: 'var(--dark-3)', borderRadius: '14px', padding: '36px 28px',
                border: `1px solid ${best ? 'rgba(201,169,110,0.35)' : 'rgba(255,255,255,0.05)'}`,
                borderTop: `3px solid ${color}`,
                position: 'relative',
              }}>
                {best && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: '#08080f', fontSize: '10px', fontWeight: 700, letterSpacing: '2px', padding: '4px 16px', borderRadius: '20px' }}>
                    推荐
                  </div>
                )}
                <div style={{ fontSize: '10px', letterSpacing: '2px', color, textTransform: 'uppercase', marginBottom: '8px' }}>{en}</div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{name}</div>
                <div style={{ fontSize: '13px', color, marginBottom: '20px', fontWeight: 500 }}>{price}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9, marginBottom: '24px' }}>{desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'rgba(232,232,240,0.7)' }}>
                      <span style={{ color, fontSize: '14px' }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Domain Cards */}
      <section style={{ padding: '0 6% 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '40px' }}>专项运输领域</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {DOMAINS.map(({ title, icon, items }) => (
              <div key={title} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '28px 24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>{title}</div>
                {items.map(item => (
                  <div key={item} style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px', paddingLeft: '12px', borderLeft: '1px solid rgba(201,169,110,0.2)' }}>{item}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
