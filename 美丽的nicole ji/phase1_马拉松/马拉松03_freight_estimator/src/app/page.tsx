'use client';
import { useState, useMemo, useEffect } from 'react';

type FType = 'air' | 'obc';
type RKey  = 'jp-cn' | 'cn-eu' | 'cn-us' | 'custom';

interface Route { label: string; from: string; to: string; sym: string; cur: string; airR: number; obcR: number; }
interface Addon { id: number; name: string; amt: string; }

const ROUTES: Record<RKey, Route> = {
  'jp-cn':  { label: '日本 → 中国', from: 'NRT/KIX', to: 'PVG/PEK', sym: '¥', cur: 'JPY', airR: 480, obcR: 2800 },
  'cn-eu':  { label: '中国 → 欧洲', from: 'PVG/PEK', to: 'FRA/AMS', sym: '$', cur: 'USD', airR: 5.5, obcR: 35   },
  'cn-us':  { label: '中国 → 美国', from: 'PVG/PEK', to: 'ORD/LAX', sym: '$', cur: 'USD', airR: 6.0, obcR: 38   },
  'custom': { label: '自定义航线',   from: '',        to: '',        sym: '$', cur: 'USD', airR: 5.0, obcR: 30   },
};

const QUICK: Record<FType, string[]> = {
  air: ['燃油附加费', '安全附加费', '操作费', '清关费'],
  obc: ['机场服务费', '包装费', '行李托运费'],
};

function numFmt(v: number, cur: string, sym: string): string {
  return cur === 'JPY' ? `${sym}${Math.round(v).toLocaleString()}` : `${sym}${v.toFixed(2)}`;
}
function wFmt(w: number): string {
  if (!Number.isFinite(w) || w <= 0) return '—';
  return w % 1 === 0 ? String(w) : w.toFixed(2);
}

export default function Page() {
  const [ftype, setFtype] = useState<FType>('air');
  const [rkey,  setRkey]  = useState<RKey>('jp-cn');
  const [cfrom, setCfrom] = useState('');
  const [cto,   setCto]   = useState('');
  const [pieces, setPieces] = useState('1');
  const [wpp,    setWpp]    = useState('');
  const [dimL,   setDimL]   = useState('');
  const [dimW,   setDimW]   = useState('');
  const [dimH,   setDimH]   = useState('');
  const [rate,   setRate]   = useState(String(ROUTES['jp-cn'].airR));
  const [addons, setAddons] = useState<Addon[]>([]);

  useEffect(() => {
    const r = ROUTES[rkey];
    setRate(String(ftype === 'air' ? r.airR : r.obcR));
  }, [rkey, ftype]);

  const ri = ROUTES[rkey];

  const addAddon = (name = '') => setAddons(p => [...p, { id: Date.now(), name, amt: '' }]);
  const rmAddon  = (id: number) => setAddons(p => p.filter(a => a.id !== id));
  const upAddon  = (id: number, f: 'name' | 'amt', v: string) =>
    setAddons(p => p.map(a => a.id === id ? { ...a, [f]: v } : a));

  const calc = useMemo(() => {
    const pc = parseFloat(pieces) || 0;
    const w  = parseFloat(wpp)    || 0;
    const l  = parseFloat(dimL)   || 0;
    const ww = parseFloat(dimW)   || 0;
    const h  = parseFloat(dimH)   || 0;
    const r  = parseFloat(rate)   || 0;
    const totalActual = pc * w;
    const volW   = l * ww * h * pc / 6000;
    const chargeW = Math.max(totalActual, volW);
    const baseF   = chargeW * r;
    const addonsT = addons.reduce((s, a) => s + (parseFloat(a.amt) || 0), 0);
    return { totalActual, volW, chargeW, baseF, addonsT, total: baseF + addonsT, useVol: volW > totalActual && volW > 0 };
  }, [pieces, wpp, dimL, dimW, dimH, rate, addons]);

  const obcWarn = ftype === 'obc' && calc.totalActual > 32 && calc.totalActual > 0;

  const IS: React.CSSProperties = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: '6px',
    color: '#e2e8f0', padding: '6px 8px', fontSize: '14px', outline: 'none',
  };
  const SEC: React.CSSProperties = {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '14px 16px',
  };
  const LBL: React.CSSProperties = {
    fontSize: '10px', color: '#64748b', fontWeight: 700,
    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '10px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui,"Segoe UI",sans-serif', padding: '24px' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#38bdf8', margin: 0 }}>
          ✈️ OPTEC 运费快速估算器
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '5px' }}>
          空运 · Handcarry OBC · 实重 vs 体积重自动取大值 · 多项附加费合计
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ════ LEFT: Inputs ════ */}
        <div style={{ width: '44%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Freight type */}
          <div style={SEC}>
            <div style={LBL}>运输方式</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['air', 'obc'] as FType[]).map(t => (
                <button key={t} onClick={() => setFtype(t)} style={{
                  flex: 1, padding: '10px 6px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
                  background: ftype === t ? (t === 'air' ? '#0c2240' : '#1e0a3c') : '#1e293b',
                  border: `2px solid ${ftype === t ? (t === 'air' ? '#0ea5e9' : '#a78bfa') : '#334155'}`,
                  color:  ftype === t ? (t === 'air' ? '#7dd3fc' : '#c4b5fd') : '#64748b',
                }}>
                  {t === 'air' ? '✈️ 空运 AIR' : '🧳 Handcarry OBC'}
                </button>
              ))}
            </div>
          </div>

          {/* Route */}
          <div style={SEC}>
            <div style={LBL}>航线选择</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
              {(Object.keys(ROUTES) as RKey[]).map(k => (
                <button key={k} onClick={() => setRkey(k)} style={{
                  padding: '8px 6px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                  background: rkey === k ? '#0c2240' : '#1e293b',
                  border: `1px solid ${rkey === k ? '#0ea5e9' : '#334155'}`,
                  color:  rkey === k ? '#7dd3fc' : '#94a3b8',
                }}>
                  {ROUTES[k].label}
                </button>
              ))}
            </div>
            {rkey === 'custom' ? (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                <input value={cfrom} onChange={e => setCfrom(e.target.value)} placeholder="出发地 NRT"
                  style={{ ...IS, flex: 1, fontSize: '13px' }} />
                <span style={{ color: '#475569' }}>→</span>
                <input value={cto} onChange={e => setCto(e.target.value)} placeholder="目的地 FRA"
                  style={{ ...IS, flex: 1, fontSize: '13px' }} />
              </div>
            ) : (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
                {ri.from} → {ri.to} · {ri.cur}
              </div>
            )}
          </div>

          {/* Cargo info */}
          <div style={SEC}>
            <div style={LBL}>货物信息</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', width: '74px' }}>件数</span>
                <input type="number" min="1" value={pieces} onChange={e => setPieces(e.target.value)}
                  placeholder="1" style={{ ...IS, width: '80px' }} />
                <span style={{ fontSize: '13px', color: '#64748b' }}>件</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', width: '74px' }}>实重 / 件</span>
                <input type="number" min="0" step="0.1" value={wpp} onChange={e => setWpp(e.target.value)}
                  placeholder="0.0" style={{ ...IS, width: '80px' }} />
                <span style={{ fontSize: '13px', color: '#64748b' }}>kg</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', width: '74px' }}>尺寸 / 件</span>
                <input type="number" min="0" value={dimL} onChange={e => setDimL(e.target.value)}
                  placeholder="L" style={{ ...IS, width: '54px' }} />
                <span style={{ fontSize: '11px', color: '#475569' }}>×</span>
                <input type="number" min="0" value={dimW} onChange={e => setDimW(e.target.value)}
                  placeholder="W" style={{ ...IS, width: '54px' }} />
                <span style={{ fontSize: '11px', color: '#475569' }}>×</span>
                <input type="number" min="0" value={dimH} onChange={e => setDimH(e.target.value)}
                  placeholder="H" style={{ ...IS, width: '54px' }} />
                <span style={{ fontSize: '13px', color: '#64748b' }}>cm</span>
              </div>
              {ftype === 'obc' && (
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>💡 OBC 每人限携 ≤ 32 kg（超重需拆分）</div>
              )}
            </div>
          </div>

          {/* Unit rate */}
          <div style={SEC}>
            <div style={LBL}>单价（计费重量）</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 700 }}>{ri.sym}</span>
              <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)}
                style={{ ...IS, width: '100px' }} />
              <span style={{ fontSize: '13px', color: '#64748b' }}>/ kg · {ri.cur}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>参考单价，可直接修改</div>
          </div>

          {/* Addons */}
          <div style={SEC}>
            <div style={LBL}>其他费用</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
              {QUICK[ftype].map(n => (
                <button key={n} onClick={() => addAddon(n)} style={{
                  fontSize: '11px', padding: '3px 9px', borderRadius: '4px', cursor: 'pointer',
                  background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                }}>+ {n}</button>
              ))}
              <button onClick={() => addAddon()} style={{
                fontSize: '11px', padding: '3px 9px', borderRadius: '4px', cursor: 'pointer',
                background: '#1e293b', border: '1px dashed #475569', color: '#64748b',
              }}>+ 自定义</button>
            </div>
            {addons.length === 0 && (
              <div style={{ fontSize: '12px', color: '#334155', textAlign: 'center', padding: '6px 0' }}>
                点击上方按钮添加费用项目
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {addons.map(a => (
                <div key={a.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input value={a.name} onChange={e => upAddon(a.id, 'name', e.target.value)}
                    placeholder="费用名称" style={{ ...IS, flex: 1, fontSize: '13px' }} />
                  <span style={{ color: '#f59e0b', fontSize: '13px' }}>{ri.sym}</span>
                  <input type="number" min="0" value={a.amt} onChange={e => upAddon(a.id, 'amt', e.target.value)}
                    placeholder="0" style={{ ...IS, width: '80px', fontSize: '13px' }} />
                  <button onClick={() => rmAddon(a.id)} style={{
                    background: 'none', border: 'none', color: '#475569',
                    cursor: 'pointer', fontSize: '18px', padding: '0 2px', lineHeight: '1',
                  }}>×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT: Results ════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', position: 'sticky', top: '24px' }}>

          {/* OBC weight warning */}
          {obcWarn && (
            <div style={{ background: '#7f1d1d22', border: '1px solid #ef444455', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span style={{ fontSize: '13px', color: '#fca5a5' }}>
                总重量 {wFmt(calc.totalActual)} kg 超过 OBC 单人限重 32 kg，建议拆分携带或改用空运
              </span>
            </div>
          )}

          {/* Weight calculation */}
          <div style={SEC}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>
              ⚖️ 重量计算
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  实重合计（{pieces || 1} 件 × {wpp || 0} kg）
                </span>
                <span style={{ fontSize: '15px', fontWeight: calc.useVol ? 400 : 600, color: calc.useVol ? '#475569' : '#e2e8f0' }}>
                  {wFmt(calc.totalActual)} kg
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  体积重 <span style={{ fontSize: '11px' }}>（L×W×H×件÷6000）</span>
                </div>
                <span style={{ fontSize: '15px', fontWeight: calc.useVol ? 600 : 400, color: calc.useVol ? '#e2e8f0' : '#475569' }}>
                  {wFmt(calc.volW)} kg
                </span>
              </div>
              <div style={{
                background: '#081929', border: '1px solid #0ea5e944',
                borderRadius: '10px', padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px',
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>计费重量 (CW)</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    {calc.chargeW > 0
                      ? (calc.useVol ? '✦ 体积重 > 实重，以体积重计费' : '✦ 实重 ≥ 体积重，以实重计费')
                      : '请输入货物信息'}
                  </div>
                </div>
                <span style={{ fontSize: '28px', fontWeight: 800, color: '#38bdf8' }}>
                  {wFmt(calc.chargeW)} kg
                </span>
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div style={SEC}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: '14px' }}>
              💰 费用明细
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

              {/* Base freight */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px', borderBottom: '1px solid #1e293b' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
                    {ftype === 'air' ? '✈️ 基础运费' : '🧳 OBC 运费'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                    {wFmt(calc.chargeW)} kg × {ri.sym}{parseFloat(rate) || 0} / kg
                  </div>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                  {numFmt(calc.baseF, ri.cur, ri.sym)}
                </span>
              </div>

              {/* Addon rows */}
              {addons.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{a.name || '（未命名）'}</span>
                  <span style={{ fontSize: '14px', color: '#e2e8f0' }}>
                    {a.amt ? numFmt(parseFloat(a.amt) || 0, ri.cur, ri.sym) : `${ri.sym}—`}
                  </span>
                </div>
              ))}

              {addons.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px dashed #1e293b' }}>
                  <span style={{ fontSize: '12px', color: '#475569' }}>其他费用小计</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{numFmt(calc.addonsT, ri.cur, ri.sym)}</span>
                </div>
              )}

              {/* Total */}
              <div style={{
                background: '#061a0f', border: '1px solid #10b98144',
                borderRadius: '10px', padding: '14px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px',
              }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#34d399' }}>合计估算</span>
                <span style={{ fontSize: '30px', fontWeight: 800, color: '#34d399' }}>
                  {numFmt(calc.total, ri.cur, ri.sym)}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#334155', textAlign: 'center' }}>
                ※ 以上为参考估算，实际费用以正式报价单为准
              </div>
            </div>
          </div>

          {/* Summary pill */}
          <div style={{ ...SEC, padding: '12px 16px' }}>
            <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>📍 {rkey === 'custom' ? `${cfrom || '?'} → ${cto || '?'}` : `${ri.from} → ${ri.to}`}</span>
              <span>💱 {ri.cur}</span>
              <span>{ftype === 'air' ? '✈️ 空运' : '🧳 OBC'}</span>
              <span>📦 {pieces || 1} 件 · {wpp || 0} kg/件</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
