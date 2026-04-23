const TIMELINE = [
  { year: '2016', tag: '创立', title: 'OPTEC Express 东京创立', desc: '12月，木村勇貴于东京港区新橋创立OPTEC Express，以"国际紧急货运专家"为定位起步。' },
  { year: '2017', tag: '扩张', title: '香港子公司设立', desc: '东京运营中心完善24/7紧急响应体系；同年香港子公司成立，布局东亚运输网络。' },
  { year: '2018', tag: '亚洲', title: '进驻越南 & 中国烟台', desc: '河内据点与烟台办事处相继开设，构建东北亚与东南亚区域物流通道。' },
  { year: '2021', tag: '认证', title: '取得 ISO 9001:2015 认证', desc: '由SGS颁发ISO 9001品质管理体系认证，正式进入国际资质合规行列。' },
  { year: '2023', tag: '里程碑', title: '营业额突破30亿日元', desc: '取得特定航空货物运营资格，服务网络扩大至全球186座城市、96个国家。' },
  { year: '2026', tag: '10周年', title: '创立十周年', desc: '全球54名员工，10年坚守"时间就是价值"，持续深耕国际紧急物流领域。', current: true },
];

const TEAM = [
  { initial: '木', name: '木村 勇貴', en: 'Yuki Kimura', role: '代表取締役 · CEO' },
  { initial: 'J', name: 'Jenny', en: 'General Manager', role: '管理部 · 部长' },
  { initial: 'L', name: 'Luna', en: 'Business Manager', role: '业务部 · 部长' },
  { initial: 'N', name: 'Nicole Ji', en: 'Nicole Ji', role: '治理室 · 高级员工' },
];

const CERTS = [
  { icon: '🏆', title: 'ISO 9001:2015', sub: 'SGS 颁发 · 品质管理体系' },
  { icon: '✈', title: '特定航空货物取扱', sub: '日本航空货物运营资质' },
  { icon: '🧬', title: 'GDP / GMP 合规', sub: '医药品冷链合规操作认证' },
  { icon: '⚠️', title: 'IATA DGR 认证', sub: '危险品航空运输操作资质' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ padding: '80px 6% 64px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 55% 45% at 20% 60%, rgba(37,99,235,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ width: '36px', height: '2px', background: 'var(--blue-2)', display: 'inline-block' }} />
              <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase' }}>About Us</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 4.5vw, 56px)', fontWeight: 600, color: '#fff', lineHeight: 1.2, marginBottom: '24px' }}>
              公司概要<br />
              <span style={{ fontSize: '18px', color: 'var(--muted)', fontWeight: 300 }}>Company Overview</span>
            </h1>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.2 }}>
              OPTEC Express 2016年创立于日本东京，专注国际紧急货运。十年间，从两名创始成员成长为覆盖96个国家、服务186座城市的全球紧急物流网络，始终坚守"时间就是价值"。
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              ['54', '在职员工', 'Staff'],
              ['186', '目的地城市', 'Cities'],
              ['30億+', '年营业额', 'Revenue (JPY)'],
              ['10', '年行业经验', 'Years'],
            ].map(([num, zh, en]) => (
              <div key={zh} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', border: '1px solid rgba(37,99,235,0.1)' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '34px', fontWeight: 700, color: 'var(--sky)', lineHeight: 1 }}>{num}</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginTop: '8px' }}>{zh}</div>
                <div style={{ fontSize: '9px', letterSpacing: '1px', color: 'var(--muted)', textTransform: 'uppercase' }}>{en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ width: '36px', height: '2px', background: 'var(--blue-2)', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--sky)', textTransform: 'uppercase' }}>Our Journey</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '56px' }}>十年足迹</h2>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {TIMELINE.map(({ year, tag, title, desc, current }) => (
              <div key={year} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '32px', paddingBottom: '40px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '78px', top: '10px', bottom: 0, width: '1px', background: 'rgba(37,99,235,0.15)' }} />
                <div style={{ textAlign: 'right', paddingTop: '2px' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: 700, color: current ? 'var(--sky)' : 'rgba(203,213,225,0.3)', lineHeight: 1 }}>{year}</div>
                </div>
                <div style={{ paddingLeft: '24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-6px', top: '7px', width: '12px', height: '12px', borderRadius: '50%', background: current ? 'var(--blue-2)' : 'var(--dark-4)', border: `2px solid ${current ? 'var(--sky)' : 'rgba(37,99,235,0.3)'}`, boxShadow: current ? '0 0 8px rgba(96,165,250,0.4)' : 'none' }} />
                  <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--sky)', textTransform: 'uppercase', marginBottom: '6px' }}>{tag}</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{title}</div>
                  <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1.9 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ padding: '0 6% 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '12px' }}>团队成员</h2>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '40px' }}>Our Team</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
            {TEAM.map(({ initial, name, en, role }) => (
              <div key={name} style={{ background: 'var(--dark-3)', borderRadius: '14px', padding: '32px 24px', textAlign: 'center', border: '1px solid rgba(37,99,235,0.1)' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(96,165,250,0.15))', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: 'var(--sky)' }}>
                  {initial}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>{role}</div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(96,165,250,0.4)' }}>{en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section style={{ padding: '0 6% 80px', background: 'var(--dark-2)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '80px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '40px' }}>
            认证 & 资质 <span style={{ fontSize: '16px', color: 'var(--muted)', fontWeight: 300 }}>Certifications</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {CERTS.map(({ icon, title, sub }) => (
              <div key={title} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '28px 24px', border: '1px solid rgba(37,99,235,0.1)', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '26px', flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>{title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.7 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
