const TIMELINE = [
  { year: '2016', tag: '创立元年', title: 'OPTEC Express 创立', desc: '12月8日，木村勇貴于东京新桥创立OPTEC Express，以"紧急物流专业企业"为定位。' },
  { year: '2017', tag: '亚洲起步', title: '东京中心 & 香港子公司', desc: '东京运营中心正式启动，24/7紧急响应体系建立。同年香港子公司设立。' },
  { year: '2018', tag: '网络扩张', title: '越南・中国烟台开拓', desc: '布局越南河内及中国烟台，构建东北亚与东南亚区域物流网络。' },
  { year: '2021', tag: 'ISO认证', title: 'ISO 9001:2015 认证取得', desc: '获得SGS颁发ISO 9001认证，品质管理体系正式国际认可。' },
  { year: '2023', tag: '飞跃成长', title: '营业额突破30亿日元', desc: '获得特定航空货物运营资格，服务覆盖全球186座城市。' },
  { year: '2026', tag: '10周年', title: 'OPTEC 创立10周年', desc: '全球96国据点网络，54名在职员工，继续以时间证明价值。' },
];

const TEAM = [
  { name: '木村 勇貴', role: '代表取締役 · CEO', en: 'Yuki Kimura', initial: '木' },
  { name: 'Jenny', role: '管理部 · 部长', en: 'General Manager', initial: 'J' },
  { name: 'Luna', role: '业务部 · 部长', en: 'Business Manager', initial: 'L' },
  { name: '杨 紫璇', role: '治理室 · 高级员工', en: 'Yang Zixuan', initial: '杨' },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ padding: '80px 6% 60px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 30% 50%, rgba(201,169,110,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
              About Us
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 600, color: '#fff', lineHeight: 1.15, marginBottom: '24px' }}>
              用物流，<br />证明时间的价值
            </h1>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2.2 }}>
              OPTEC Express 2016年创立于东京，专注国际紧急货运。十年间，从一间办公室成长为覆盖96国、服务186城市的全球性紧急物流网络。
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[['54', '在职员工'], ['186', '目的地城市'], ['30億+', '年营业额(日元)'], ['10', '年经验']].map(([n, l]) => (
              <div key={l} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '28px 20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--muted)', marginTop: '8px' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ padding: '80px 6%' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '10px', letterSpacing: '4px', color: 'var(--gold)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span style={{ width: '32px', height: '1px', background: 'var(--gold)', display: 'inline-block' }} />
            Our Journey
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '56px' }}>十年足迹</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {TIMELINE.map(({ year, tag, title, desc }, i) => (
              <div key={year} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '32px', paddingBottom: '40px', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '88px', top: '8px', bottom: 0, width: '1px', background: 'rgba(201,169,110,0.15)' }} />
                <div style={{ textAlign: 'right', paddingTop: '2px' }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: i === TIMELINE.length - 1 ? 'var(--gold)' : 'rgba(232,232,240,0.35)', lineHeight: 1 }}>{year}</div>
                </div>
                <div style={{ paddingLeft: '24px', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-5px', top: '8px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--gold)', border: '2px solid var(--dark)', boxShadow: '0 0 0 3px rgba(201,169,110,0.2)' }} />
                  <div style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '6px' }}>{tag}</div>
                  <div style={{ fontSize: '17px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>{title}</div>
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
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '36px', fontWeight: 600, color: '#fff', marginBottom: '40px' }}>团队成员</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '20px' }}>
            {TEAM.map(({ name, role, en, initial }) => (
              <div key={name} style={{ background: 'var(--dark-3)', borderRadius: '12px', padding: '32px 24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,rgba(201,169,110,0.18),rgba(100,60,180,0.18))', border: '1px solid rgba(201,169,110,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>
                  {initial}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{name}</div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>{role}</div>
                <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'rgba(201,169,110,0.4)' }}>{en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
