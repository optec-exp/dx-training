'use client';
import { useState, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
type Mode = 'wizard' | 'form';

type DangerLevel = 'none' | 'maybe' | 'yes';
type Urgency     = 'today' | '1-3days' | 'normal';
type WeightRange = 'micro' | 'light' | 'medium' | 'heavy';

interface WizardState {
  step: number;
  danger: DangerLevel | null;
  urgency: Urgency | null;
  weight: WeightRange | null;
  origin: string;
  dest: string;
}

interface FormState {
  origin: string; dest: string;
  weight: string; dimension: string;
  cargo: string; danger: DangerLevel; urgency: Urgency;
}

// ── Diagnosis logic ──────────────────────────────────────────────────────────
interface DiagResult {
  service: string;
  serviceIcon: string;
  color: string;
  summary: string;
  notes: string[];
  contact: string;
  contactRole: string;
}

function diagnose(
  danger: DangerLevel | null,
  urgency: Urgency | null,
  weight: WeightRange | null,
  origin: string,
  dest: string,
): DiagResult | null {
  if (!danger || !urgency || !weight) return null;

  const route = (origin && dest) ? `${origin.toUpperCase()} → ${dest.toUpperCase()}` : '待确认航线';

  if (danger === 'yes') {
    return {
      service: '危险品专项空运',
      serviceIcon: '⚠️',
      color: '#ef4444',
      summary: '货物含危险品，需要专项申报和特殊包装，不可走普通空运或OBC。',
      notes: [
        '必须提供MSDS（物质安全数据表）',
        '需要危险品包装认证（UN编码）',
        '部分危险品禁止航空运输，需提前确认',
        '航线：' + route,
      ],
      contact: 'GC部門危险品专线',
      contactRole: '03-XXXX-0020 / gc@optec-exp.com',
    };
  }

  if (urgency === 'today' && (weight === 'micro' || weight === 'light')) {
    return {
      service: 'OBC（随身携带快递）',
      serviceIcon: '🏃',
      color: '#f59e0b',
      summary: '极度紧急 + 货物轻小，推荐 OBC 服务：由专人随身携带货物乘坐当日航班交付。',
      notes: [
        '单次最多携带 ≈ 32kg / 机舱行李限制',
        '费用较高，但可实现当日到达',
        '需提前2-3小时联系确认可用人员',
        '航线：' + route,
      ],
      contact: 'OBC紧急专线',
      contactRole: '03-XXXX-0002 / urgent@optec-exp.com',
    };
  }

  if (urgency === 'today' && (weight === 'medium' || weight === 'heavy')) {
    return {
      service: '包机/货运优先空运',
      serviceIcon: '✈️',
      color: '#f97316',
      summary: '极度紧急但货物较重，OBC 不适用，推荐包机或优先货机处理。',
      notes: [
        '重货（50kg以上）无法走 OBC',
        '需要提前预订货机舱位',
        '费用视重量和航班而定',
        '航线：' + route,
      ],
      contact: '操作部紧急专线',
      contactRole: '03-XXXX-0010 / os@optec-exp.com',
    };
  }

  if (urgency === '1-3days') {
    const wLabel = weight === 'micro' ? '≤5kg' : weight === 'light' ? '5–50kg' : weight === 'medium' ? '50–500kg' : '500kg以上';
    return {
      service: '优先空运',
      serviceIcon: '✈️',
      color: '#0ea5e9',
      summary: `货物重量 ${wLabel}，1–3天交付需求，推荐优先空运服务，确保在目标时间内到达。`,
      notes: [
        '建议提前24小时委托以确保舱位',
        '可提供实时追踪',
        danger === 'maybe' ? '⚠️ 存在潜在危险品风险，需额外确认' : '无危险品限制',
        '航线：' + route,
      ],
      contact: '操作部 OS',
      contactRole: '03-XXXX-0010 / os@optec-exp.com',
    };
  }

  // normal urgency
  const wLabel = weight === 'micro' ? '≤5kg' : weight === 'light' ? '5–50kg' : weight === 'medium' ? '50–500kg' : '500kg以上';
  return {
    service: '标准空运',
    serviceIcon: '📦',
    color: '#22c55e',
    summary: `货物重量 ${wLabel}，标准空运服务，费用经济，通常3–7个工作日到达。`,
    notes: [
      '费用为空运中最经济的方案',
      '可提供全程追踪',
      danger === 'maybe' ? '⚠️ 存在潜在危险品风险，需提前确认' : '无危险品限制',
      '航线：' + route,
    ],
    contact: '营业部',
    contactRole: '03-XXXX-0040 / sales@optec-exp.com',
  };
}

// ── Wizard mode ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, q: '货物是否含危险品？', key: 'danger' },
  { id: 2, q: '交付紧急程度？',    key: 'urgency' },
  { id: 3, q: '货物重量范围？',    key: 'weight' },
  { id: 4, q: '出发地 / 目的地？', key: 'route' },
];

const BTN: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 10, border: '2px solid #1e3a5f',
  background: '#0d1b2e', color: '#e2e8f0', cursor: 'pointer', fontSize: 14,
  fontWeight: 600, textAlign: 'left', transition: 'all .2s', width: '100%',
};

const BTN_ACTIVE: React.CSSProperties = { ...BTN, border: '2px solid #3b82f6', background: '#0a1e3d', color: '#93c5fd' };

function WizardMode() {
  const [s, setS] = useState<WizardState>({ step: 1, danger: null, urgency: null, weight: null, origin: '', dest: '' });

  const result = useMemo(() => diagnose(s.danger, s.urgency, s.weight, s.origin, s.dest), [s]);
  const isDone = s.danger !== null && s.urgency !== null && s.weight !== null;

  const reset = () => setS({ step: 1, danger: null, urgency: null, weight: null, origin: '', dest: '' });

  const pick = <K extends keyof WizardState>(key: K, val: WizardState[K]) => {
    setS(p => ({ ...p, [key]: val, step: Math.max(p.step, STEPS.findIndex(x => x.key === key) + 2) }));
  };

  const INP: React.CSSProperties = {
    background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 6,
    color: '#e2e8f0', padding: '9px 12px', flex: 1, fontSize: 13,
  };

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {STEPS.map((st, i) => {
          const done = i < s.step - 1;
          const active = i === s.step - 1;
          return (
            <div key={st.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? '#22c55e' : active ? '#3b82f6' : '#1e3a5f',
                color: done ? '#fff' : active ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700,
              }}>
                {done ? '✓' : st.id}
              </div>
              <div style={{ fontSize: 11, color: done ? '#4ade80' : active ? '#93c5fd' : '#475569', textAlign: 'center' }}>
                {st.q.split('？')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Q1 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 12, color: '#93c5fd' }}>Q1. 货物是否含危险品？</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([['none', '🟢 不含危险品'], ['maybe', '🟡 不确定（含化学品/锂电池等）'], ['yes', '🔴 确定含危险品']] as [DangerLevel, string][]).map(([v, label]) => (
            <button key={v} style={s.danger === v ? BTN_ACTIVE : BTN} onClick={() => pick('danger', v)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Q2 */}
      {s.step >= 2 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#93c5fd' }}>Q2. 交付紧急程度？</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([['today', '🚨 极度紧急（当日必须到达）'], ['1-3days', '⚡ 紧急（1–3天内）'], ['normal', '📦 普通（不限期）']] as [Urgency, string][]).map(([v, label]) => (
              <button key={v} style={s.urgency === v ? BTN_ACTIVE : BTN} onClick={() => pick('urgency', v)}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Q3 */}
      {s.step >= 3 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#93c5fd' }}>Q3. 货物重量范围？</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {([['micro', '🪶 微小件（≤5kg）'], ['light', '📦 轻货（5–50kg）'], ['medium', '🏗️ 中重货（50–500kg）'], ['heavy', '🏭 大型货物（500kg以上）']] as [WeightRange, string][]).map(([v, label]) => (
              <button key={v} style={s.weight === v ? BTN_ACTIVE : BTN} onClick={() => pick('weight', v)}>{label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Q4 */}
      {s.step >= 4 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, color: '#93c5fd' }}>Q4. 出发地 / 目的地（选填）</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input style={INP} placeholder="出发地（如 NRT）" value={s.origin} onChange={e => setS(p => ({ ...p, origin: e.target.value }))} />
            <span style={{ color: '#64748b', alignSelf: 'center' }}>→</span>
            <input style={INP} placeholder="目的地（如 HKG）" value={s.dest} onChange={e => setS(p => ({ ...p, dest: e.target.value }))} />
          </div>
        </div>
      )}

      {/* Result */}
      {isDone && result && <DiagnosisResult result={result} onReset={reset} />}
    </div>
  );
}

// ── Form mode ────────────────────────────────────────────────────────────────
function FormMode() {
  const [f, setF] = useState<FormState>({
    origin: '', dest: '', weight: '', dimension: '', cargo: '',
    danger: 'none', urgency: 'normal',
  });
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    const wkg = parseFloat(f.weight);
    const w: WeightRange = isNaN(wkg) ? 'light'
      : wkg <= 5 ? 'micro'
      : wkg <= 50 ? 'light'
      : wkg <= 500 ? 'medium'
      : 'heavy';
    return diagnose(f.danger, f.urgency, w, f.origin, f.dest);
  }, [submitted, f]);

  const INP: React.CSSProperties = {
    background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 6,
    color: '#e2e8f0', padding: '8px 12px', width: '100%', fontSize: 13,
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['出发地', 'origin', '如 NRT、东京'], ['目的地', 'dest', '如 HKG、香港'], ['货物重量 (kg)', 'weight', '如 25'], ['货物尺寸', 'dimension', '如 50×40×30 cm']].map(([label, key, ph]) => (
          <div key={key}>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
            <input style={INP} placeholder={ph}
              value={f[key as keyof FormState] as string}
              onChange={e => { setSubmitted(false); setF(p => ({ ...p, [key]: e.target.value })); }} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>货物描述</div>
        <input style={INP} placeholder="货物名称或描述"
          value={f.cargo} onChange={e => { setSubmitted(false); setF(p => ({ ...p, cargo: e.target.value })); }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>危险品情况</div>
          {(['none', 'maybe', 'yes'] as DangerLevel[]).map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
              <input type="radio" checked={f.danger === v}
                onChange={() => { setSubmitted(false); setF(p => ({ ...p, danger: v })); }} />
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                {v === 'none' ? '🟢 不含危险品' : v === 'maybe' ? '🟡 不确定' : '🔴 含危险品'}
              </span>
            </label>
          ))}
        </div>
        <div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>紧急程度</div>
          {(['today', '1-3days', 'normal'] as Urgency[]).map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
              <input type="radio" checked={f.urgency === v}
                onChange={() => { setSubmitted(false); setF(p => ({ ...p, urgency: v })); }} />
              <span style={{ fontSize: 13, color: '#e2e8f0' }}>
                {v === 'today' ? '🚨 当日紧急' : v === '1-3days' ? '⚡ 1–3天' : '📦 普通'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => setSubmitted(true)}
        style={{
          width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
          color: '#fff', fontSize: 15, fontWeight: 700,
        }}
      >
        🔍 开始诊断
      </button>

      {submitted && result && (
        <div style={{ marginTop: 24 }}>
          <DiagnosisResult result={result} onReset={() => setSubmitted(false)} resetLabel="重新诊断" />
        </div>
      )}
    </div>
  );
}

// ── Shared result component ──────────────────────────────────────────────────
function DiagnosisResult({ result: r, onReset, resetLabel = '重新开始' }: {
  result: DiagResult; onReset: () => void; resetLabel?: string;
}) {
  return (
    <div style={{ background: '#020810', borderRadius: 12, padding: 24, border: `2px solid ${r.color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{ fontSize: 32 }}>{r.serviceIcon}</span>
        <div>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>推荐服务</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.service}</div>
        </div>
      </div>
      <div style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{r.summary}</div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>注意事项</div>
        {r.notes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, color: '#94a3b8' }}>
            <span style={{ color: r.color, flexShrink: 0 }}>•</span>
            <span>{n}</span>
          </div>
        ))}
      </div>
      <div style={{
        background: '#0d1b2e', borderRadius: 8, padding: 14,
        border: `1px solid ${r.color}`, marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>推荐联系</div>
        <div style={{ fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.contact}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{r.contactRole}</div>
      </div>
      <button
        onClick={onReset}
        style={{
          padding: '9px 20px', borderRadius: 8, border: '1px solid #1e3a5f',
          background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 13,
        }}
      >
        ↩ {resetLabel}
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Page() {
  const [mode, setMode] = useState<Mode>('wizard');

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🔬 服务诊断工具</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>空运 vs OBC · 航线推荐 · 危险品判断</div>
        </div>

        {/* Mode tabs */}
        <div style={{
          display: 'flex', background: '#0d1b2e', borderRadius: 10, padding: 4,
          marginBottom: 24, border: '1px solid #1e3a5f',
        }}>
          {([['wizard', '💬 问答引导'], ['form', '📋 表单模式']] as [Mode, string][]).map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === m ? '#1e40af' : 'transparent',
                color: mode === m ? '#93c5fd' : '#64748b',
                fontSize: 14, fontWeight: mode === m ? 700 : 400, transition: 'all .2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 24, border: '1px solid #1e3a5f' }}>
          {mode === 'wizard' ? <WizardMode /> : <FormMode />}
        </div>

        {/* Legend */}
        <div style={{
          marginTop: 20, background: '#0d1b2e', borderRadius: 10, padding: 16,
          border: '1px solid #1e3a5f', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        }}>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, gridColumn: '1/-1', marginBottom: 4 }}>服务类型说明</div>
          {[
            ['🏃', 'OBC', '随身携带·当日最快'],
            ['⚠️', '危险品专项', '特殊申报+认证'],
            ['✈️', '优先空运', '1–3天·确保舱位'],
            ['📦', '标准空运', '3–7天·经济方案'],
          ].map(([icon, name, desc]) => (
            <div key={name} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0' }}>{name}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
