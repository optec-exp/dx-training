import Link from 'next/link';

const SERVICES = [
  { icon: '✈', title: 'AOG 航材紧急运输', desc: '飞机停飞零件全球24/7紧急调配，最短时间恢复航班运营。' },
  { icon: '🧬', title: '医药品 & 生命科学', desc: 'CellChain全程温控，GDP合规，确保品质不妥协。' },
  { icon: '📦', title: 'NFO 最速航班', desc: '当日/翌日出发，全球186城市覆盖，OBC随身可选。' },
  { icon: '🔒', title: '危险品专项运输', desc: 'IATA DGR认证，危险品申告・包装・航空协调一体化。' },
  { icon: '🌐', title: 'TALA Agent 网络', desc: '96国合作伙伴网络，本地通关与末端配送无缝衔接。' },
  { icon: '📋', title: '通关 & 文件支持', desc: '专业单证团队处理进出口报关、许可证、ATA Carnet。' },
];

const STATS = [
  { num: '186', label: '目的地城市' },
  { num: '96',  label: '合作国家' },
  { num: '24/7',label: '全天候响应' },
  { num: '10+', label: '年行业经验' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '80px 6%', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(201,169,110,0.055) 0%, transparent 65%)',
        }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            Global Urgent Logistics Since 2016
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(44px,6vw,84px)', fontWeight: 600, color: '#fff', lineHeight: 1.1, marginBottom: '24px' }}>
            时间，是我们<br />
            <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>最重要的产品</em>
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.1, maxWidth: '520px', marginBottom: '48px' }}>
            OPTEC Express 专注国际紧急货运——AOG航材、医药品、精密仪器，
            当每一分钟都至关重要，我们确保货物比任何人都快地抵达目的地。
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link href="/services" style={{ padding: '14px 32px', background: 'var(--gold)', color: '#08080f', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              查看服务
            </Link>
            <Link href="/contact" style={{ padding: '14px 32px', border: '1px solid rgba(201,169,110,0.35)', color: 'var(--gold)', borderRadius: '6px', fontWeight: 500, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              联系我们
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 6%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
          {STATS.map(({ num, label }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginTop: '8px' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      <section style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            Our Services
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '40px', fontWeight: 600, color: '#fff', marginBottom: '48px' }}>核心服务</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {SERVICES.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '32px 28px', border: '1px solid rgba(255,255,255,0.05)', borderTop: '2px solid rgba(201,169,110,0.3)' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '10px' }}>{title}</div>
                <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: '1.9' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 6%', textAlign: 'center', background: 'var(--dark-2)' }}>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>准备好了吗？</h2>
        <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '36px' }}>无论是一票紧急航材，还是长期物流合作，我们随时准备为您服务。</p>
        <Link href="/contact" style={{ display: 'inline-block', padding: '16px 40px', background: 'var(--gold)', color: '#08080f', borderRadius: '6px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
          立即咨询
        </Link>
      </section>
    </>
  );
}
