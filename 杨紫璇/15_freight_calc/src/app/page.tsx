'use client';
import { useState } from 'react';

// ── 费率数据 ──────────────────────────────────────────
const REGIONS = [
  { id: 'asia',         label: '亚洲',   en: 'Asia',          flag: '🌏', ratePerKg: 1200, minCharge: 8000,  transit: '1–2 工作日' },
  { id: 'europe',       label: '欧洲',   en: 'Europe',        flag: '🌍', ratePerKg: 2800, minCharge: 18000, transit: '2–3 工作日' },
  { id: 'north_america',label: '北美',   en: 'North America', flag: '🌎', ratePerKg: 2500, minCharge: 16000, transit: '2–3 工作日' },
  { id: 'middle_east',  label: '中东',   en: 'Middle East',   flag: '🕌', ratePerKg: 2200, minCharge: 14000, transit: '2–3 工作日' },
  { id: 'oceania',      label: '大洋洲', en: 'Oceania',       flag: '🦘', ratePerKg: 3200, minCharge: 20000, transit: '3–4 工作日' },
];

const SERVICES = [
  { id: 'standard', label: '普通航空',      en: 'Standard Air',   multiplier: 1.0, color: '#60a5fa', desc: '常规航班，适合有一定时间余量的货物' },
  { id: 'nfo',      label: 'NFO 最速航班', en: 'Next Flight Out', multiplier: 1.6, color: '#c9a96e', desc: '下一班最快航班，优先装载，24/7 专属协调员' },
  { id: 'obc',      label: 'OBC 随身携带', en: 'On Board Courier', multiplier: 3.0, color: '#a78bfa', desc: '信使随行，最高速度与安全，适合极端紧急场景' },
];

const FUEL_RATE   = 0.25;  // 25% fuel surcharge
const SECURITY_FEE = 500;  // flat ¥500

interface CalcResult {
  baseFee: number;
  fuelSurcharge: number;
  securityFee: number;
  total: number;
  region: typeof REGIONS[0];
  service: typeof SERVICES[0];
  weight: number;
}

// ── 计算函数 ──────────────────────────────────────────
function calculate(weight: number, regionId: string, serviceId: string): CalcResult {
  const region  = REGIONS.find(r => r.id === regionId)!;
  const service = SERVICES.find(s => s.id === serviceId)!;

  const rawBase    = weight * region.ratePerKg * service.multiplier;
  const baseFee    = Math.max(rawBase, region.minCharge * service.multiplier);
  const fuelSurcharge = baseFee * FUEL_RATE;
  const total      = baseFee + fuelSurcharge + SECURITY_FEE;

  return { baseFee, fuelSurcharge, securityFee: SECURITY_FEE, total, region, service, weight };
}

function fmt(n: number) {
  return '¥' + Math.round(n).toLocaleString('ja-JP');
}

// ── メインコンポーネント ──────────────────────────────
export default function Home() {
  const [weight,    setWeight]    = useState<string>('');
  const [regionId,  setRegionId]  = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('standard');
  const [result,    setResult]    = useState<CalcResult | null>(null);
  const [error,     setError]     = useState<string>('');

  function handleCalc() {
    const w = parseFloat(weight);
    if (!weight || isNaN(w) || w <= 0) { setError('请输入有效的货物重量（大于 0 kg）'); return; }
    if (!regionId)                       { setError('请选择目的地区域'); return; }
    setError('');
    setResult(calculate(w, regionId, serviceId));
  }

  function handleReset() {
    setWeight(''); setRegionId(''); setServiceId('standard'); setResult(null); setError('');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--dark-3)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px', padding: '14px 16px', color: '#fff', fontSize: '14px',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', letterSpacing: '1.5px', color: 'var(--muted)',
    textTransform: 'uppercase', marginBottom: '8px',
  };

  return (
    <div style={{ background: 'var(--dark)', minHeight: '100vh' }}>

      {/* Header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 6%', background: 'rgba(8,8,15,0.88)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,169,110,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px' }}>OPTEC</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '1px' }}>EXPRESS</span>
        </div>
        <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase' }}>Freight Calculator</div>
      </header>

      {/* Hero */}
      <section style={{ padding: '120px 6% 60px', background: 'var(--dark-2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 60%, rgba(201,169,110,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)', borderRadius: '20px', padding: '6px 16px', marginBottom: '24px' }}>
            <span style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase' }}>✈ Air Freight Estimator</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(36px,5vw,64px)', fontWeight: 600, color: '#fff', lineHeight: 1.1, marginBottom: '16px' }}>
            航空货运费用模拟器
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--muted)', lineHeight: 2 }}>
            输入货物重量与目的地区域，即时获取运输费用估算。<br />
            含燃油附加费，适用于 AOG、医药品及一般紧急货物。
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section style={{ padding: '60px 6%' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '40px', alignItems: 'start' }}>

          {/* Form */}
          <div style={{ background: 'var(--dark-3)', borderRadius: '16px', padding: '40px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: 600, color: '#fff', marginBottom: '32px' }}>输入货物信息</h2>

            {/* Weight */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>货物重量（kg）*</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number" min="0.1" step="0.1"
                  placeholder="例：25.5"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '48px' }}
                />
                <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--muted)' }}>kg</span>
              </div>
            </div>

            {/* Region */}
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>目的地区域 *</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {REGIONS.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setRegionId(r.id)}
                    style={{
                      padding: '12px 16px', borderRadius: '10px', border: `1px solid ${regionId === r.id ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.08)'}`,
                      background: regionId === r.id ? 'rgba(201,169,110,0.12)' : 'var(--dark-4)',
                      color: regionId === r.id ? 'var(--gold)' : '#e8e8f0',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '16px', marginBottom: '2px' }}>{r.flag}</div>
                    <div style={{ fontSize: '12px', fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{r.en}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Service */}
            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>运输方式</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {SERVICES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    style={{
                      padding: '14px 16px', borderRadius: '10px', border: `1px solid ${serviceId === s.id ? s.color + '60' : 'rgba(255,255,255,0.08)'}`,
                      background: serviceId === s.id ? s.color + '14' : 'var(--dark-4)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: serviceId === s.id ? s.color : '#e8e8f0', marginBottom: '2px' }}>{s.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: '11px', color: s.color, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                      ×{s.multiplier.toFixed(1)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', padding: '12px 16px', fontSize: '12px', color: '#fca5a5', marginBottom: '20px' }}>
                ⚠ {error}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCalc}
                style={{ flex: 1, padding: '14px', background: 'var(--gold)', color: '#08080f', borderRadius: '10px', fontWeight: 700, fontSize: '13px', letterSpacing: '1px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}
              >
                计算费用
              </button>
              {result && (
                <button
                  onClick={handleReset}
                  style={{ padding: '14px 20px', background: 'transparent', color: 'var(--muted)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '13px' }}
                >
                  重置
                </button>
              )}
            </div>
          </div>

          {/* Result */}
          {result && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

              {/* Total Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(201,169,110,0.12), rgba(201,169,110,0.04))', border: '1px solid rgba(201,169,110,0.3)', borderRadius: '16px', padding: '32px', marginBottom: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '12px' }}>估算总费用</div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '48px', fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: '8px' }}>
                  {fmt(result.total)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>含燃油附加费 · 仅供参考</div>
              </div>

              {/* Breakdown */}
              <div style={{ background: 'var(--dark-3)', borderRadius: '16px', padding: '28px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '20px' }}>费用明细</div>
                {[
                  { label: `基础运费（${result.weight} kg × ${result.region.ratePerKg.toLocaleString()} × ${result.service.multiplier}）`, value: result.baseFee },
                  { label: `燃油附加费（${(FUEL_RATE * 100).toFixed(0)}%）`, value: result.fuelSurcharge },
                  { label: '安全附加费', value: result.securityFee },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8e8f0' }}>{fmt(value)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>合计</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gold)' }}>{fmt(result.total)}</span>
                </div>
              </div>

              {/* Info Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: '目的地区域', value: `${result.region.flag} ${result.region.label}`, sub: result.region.en },
                  { label: '运输方式',   value: result.service.label, sub: result.service.en },
                  { label: '预计时效',   value: result.region.transit, sub: '工作日起飞后' },
                  { label: '货物重量',   value: `${result.weight} kg`, sub: '实际重量' },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{ background: 'var(--dark-3)', borderRadius: '10px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', letterSpacing: '1px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{value}</div>
                    <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', padding: '14px 16px', background: 'rgba(201,169,110,0.06)', borderRadius: '10px', border: '1px solid rgba(201,169,110,0.15)', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.8 }}>
                ※ 本估算仅供参考，实际费用因货物性质、体积重、附加服务等因素而异。如需正式报价，请联系 OPTEC Express 客服。
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--dark-2)', borderTop: '1px solid rgba(255,255,255,0.04)', padding: '28px 6%', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--gold)', letterSpacing: '2px', marginBottom: '6px' }}>OPTEC EXPRESS</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Global Urgent Logistics Since 2016 · 03-4500-7408</div>
      </footer>
    </div>
  );
}
