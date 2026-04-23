import Link from 'next/link';

const STATS = [
  { num: '186', en: 'Cities', zh: '目的地城市' },
  { num: '96',  en: 'Countries', zh: '合作国家' },
  { num: '24/7', en: 'Response', zh: '全天候响应' },
  { num: '10+', en: 'Years', zh: '年行业经验' },
];

const SERVICES = [
  { icon: '✈', title: 'AOG 航材紧急运输', en: 'Aircraft on Ground', desc: '飞机停飞零件24/7全球调配，最短响应时间，确保航班尽快复飞。' },
  { icon: '🧬', title: '医药品 & 生命科学', en: 'Pharma & Life Science', desc: 'CellChain全程温控管理，GDP/GMP合规，专业处理细胞、试剂与生物制剂。' },
  { icon: '⚡', title: 'NFO 最速航班', en: 'Next Flight Out', desc: '当日/翌日起飞，优先装载，24/7专属协调员全程跟进。' },
  { icon: '👤', title: 'OBC 随身携带', en: 'On Board Courier', desc: '专属信使全程随行护送，手提行李运输，最高安全与速度。' },
  { icon: '🌐', title: 'TALA 代理网络', en: 'Agent Network', desc: '96国全球合作伙伴，本地通关与末端配送无缝衔接。' },
  { icon: '📋', title: '通关 & 文件支持', en: 'Customs & Docs', desc: '进出口申报、危险品、ATA单证册，专业单证团队一站式处理。' },
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
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 55% at 20% 50%, rgba(37,99,235,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '15%', right: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '20px', padding: '6px 16px', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'inline-block', boxShadow: '0 0 6px #2563eb' }} />
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--sky)', textTransform: 'uppercase' }}>Global Urgent Logistics Since 2016</span>
          </div>

          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(42px, 6vw, 80px)', fontWeight: 600, color: '#fff', lineHeight: 1.12, marginBottom: '28px' }}>
            当时间就是一切，<br />
            <em style={{ color: 'var(--sky)', fontStyle: 'normal' }}>我们比任何人都快。</em>
          </h1>
          <p style={{ fontSize: '15px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.1, maxWidth: '540px', marginBottom: '48px' }}>
            OPTEC Express 专注国际紧急货运，覆盖186个城市与96个国家。<br />
            AOG航材、医药品冷链、精密仪器——每一票货物，都是我们的承诺。
          </p>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link href="/services" style={{ padding: '14px 34px', background: 'var(--blue)', color: '#fff', borderRadius: '7px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              查看服务 / Services
            </Link>
            <Link href="/contact" style={{ padding: '14px 34px', border: '1px solid rgba(96,165,250,0.3)', color: 'var(--sky)', borderRadius: '7px', fontWeight: 500, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              立即咨询 / Contact
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(37,99,235,0.08)', borderBottom: '1px solid rgba(37,99,235,0.08)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 6%', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '24px' }}>
          {STATS.map(({ num, en, zh }) => (
            <div key={zh} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 700, color: 'var(--sky)', lineHeight: 1 }}>{num}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginTop: '6px' }}>{zh}</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Overview */}
      <section style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '36px', height: '2px', background: 'var(--blue-2)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase' }}>Our Services</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '40px', fontWeight: 600, color: '#fff' }}>
              核心服务 <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 300 }}>Core Services</span>
            </h2>
            <Link href="/services" style={{ fontSize: '12px', color: 'var(--sky)', letterSpacing: '1px', textDecoration: 'none', borderBottom: '1px solid rgba(96,165,250,0.3)', paddingBottom: '2px' }}>
              全部服务 →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px' }}>
            {SERVICES.map(({ icon, title, en, desc }) => (
              <div key={title} style={{
                background: 'var(--dark-3)', borderRadius: '14px', padding: '32px 28px',
                border: '1px solid rgba(37,99,235,0.1)',
                borderTop: '2px solid rgba(37,99,235,0.4)',
                transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '10px', color: 'var(--sky)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>{en}</div>
                <div style={{ fontSize: '13px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '80px 6%', background: 'var(--dark-2)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase', marginBottom: '20px' }}>Ready to Ship?</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>
            紧急货物，立即出发
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 2, marginBottom: '40px' }}>
            无论是一票AOG航材，还是长期医药品物流合作，<br />我们的团队24/7全天候为您待命。
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <Link href="/contact" style={{ padding: '14px 40px', background: 'var(--blue)', color: '#fff', borderRadius: '7px', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textDecoration: 'none', textTransform: 'uppercase' }}>
              发送询盘
            </Link>
            <div style={{ padding: '14px 28px', border: '1px solid rgba(248,113,113,0.35)', color: '#fca5a5', borderRadius: '7px', fontSize: '13px', fontWeight: 600 }}>
              🚨 24/7 紧急: 03-4500-1918
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
