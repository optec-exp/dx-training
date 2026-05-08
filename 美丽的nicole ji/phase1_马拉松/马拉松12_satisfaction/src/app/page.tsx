'use client';
import { useState, useMemo } from 'react';

const DIMS = [
  { key: 'punctual',  label: '准时性',   icon: '⏱️', desc: '货物按时交付的满意度' },
  { key: 'safety',    label: '货物安全',  icon: '🛡️', desc: '货物完好无损的满意度' },
  { key: 'service',   label: '客服服务',  icon: '🤝', desc: '客服响应与沟通的满意度' },
  { key: 'overall',   label: '整体满意度', icon: '⭐', desc: '对本次服务的综合评价' },
] as const;

type DimKey = typeof DIMS[number]['key'];

const STAR_LABELS: Record<number, string> = {
  1: '非常不满意', 2: '不满意', 3: '一般', 4: '满意', 5: '非常满意',
};

const STAR_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e',
};

interface FormData {
  caseNo: string;
  customer: string;
  ratings: Record<DimKey, number>;
  comments: Record<DimKey, string>;
  overall_comment: string;
  recommend: boolean | null;
}

const initForm = (): FormData => ({
  caseNo: '', customer: '',
  ratings: { punctual: 0, safety: 0, service: 0, overall: 0 },
  comments: { punctual: '', safety: '', service: '', overall: '' },
  overall_comment: '',
  recommend: null,
});

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{
            fontSize: 28, background: 'none', border: 'none', cursor: 'pointer',
            color: s <= active ? (STAR_COLORS[active] || '#eab308') : '#1e3a5f',
            transition: 'all .15s', transform: s <= active ? 'scale(1.15)' : 'scale(1)',
          }}
        >★</button>
      ))}
      {active > 0 && (
        <span style={{ fontSize: 13, color: STAR_COLORS[active], marginLeft: 4, fontWeight: 600 }}>
          {STAR_LABELS[active]}
        </span>
      )}
    </div>
  );
}

function ThankYou({ form, onReset }: { form: FormData; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const avg = useMemo(() => {
    const vals = Object.values(form.ratings).filter(v => v > 0);
    if (!vals.length) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [form.ratings]);

  const summary = useMemo(() => {
    const sep = '━━━━━━━━━━━━━━━━━━━━━━━━';
    const lines: string[] = [];
    lines.push('【OPTEC Express　服务满意度评价】');
    lines.push(sep);
    if (form.caseNo)   lines.push(`案件号：${form.caseNo}`);
    if (form.customer) lines.push(`客　户：${form.customer}`);
    lines.push(sep);
    lines.push('【各项评分】');
    DIMS.forEach(d => {
      const r = form.ratings[d.key];
      const stars = r > 0 ? '★'.repeat(r) + '☆'.repeat(5 - r) : '未评分';
      const label = r > 0 ? ` ${STAR_LABELS[r]}` : '';
      lines.push(`${d.icon} ${d.label}：${stars}${label}`);
      if (form.comments[d.key]) lines.push(`   └ ${form.comments[d.key]}`);
    });
    lines.push(sep);
    if (avg > 0) lines.push(`综合评分：${avg.toFixed(1)} / 5.0`);
    if (form.recommend !== null) lines.push(`是否推荐：${form.recommend ? '✅ 会推荐给他人' : '❌ 暂不推荐'}`);
    if (form.overall_comment) {
      lines.push('综合意见：');
      lines.push(form.overall_comment);
    }
    lines.push(sep);
    lines.push('感谢您抽出宝贵时间填写评价！');
    lines.push('您的反馈将帮助我们持续改善服务质量。');
    return lines.join('\n');
  }, [form, avg]);

  const copy = async () => {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const starsDisplay = '★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        {/* Thank you card */}
        <div style={{
          background: '#0d1b2e', borderRadius: 16, padding: 36, textAlign: 'center',
          border: '1px solid #1e3a5f', marginBottom: 20,
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#93c5fd', marginBottom: 8 }}>感谢您的评价！</div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
            您的反馈对我们非常重要，我们将持续提升服务质量
          </div>
          {avg > 0 && (
            <div style={{ background: '#020810', borderRadius: 12, padding: 20, marginBottom: 24 }}>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>综合评分</div>
              <div style={{ fontSize: 36, color: STAR_COLORS[Math.round(avg)], marginBottom: 4 }}>{avg.toFixed(1)}</div>
              <div style={{ fontSize: 22, color: STAR_COLORS[Math.round(avg)], letterSpacing: 4 }}>{starsDisplay}</div>
              <div style={{ fontSize: 13, color: STAR_COLORS[Math.round(avg)], marginTop: 4 }}>
                {STAR_LABELS[Math.round(avg)]}
              </div>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            {DIMS.map(d => {
              const r = form.ratings[d.key];
              return (
                <div key={d.key} style={{ background: '#020810', borderRadius: 8, padding: 12, textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{d.icon} {d.label}</div>
                  <div style={{ fontSize: 18, color: r > 0 ? STAR_COLORS[r] : '#1e3a5f' }}>
                    {r > 0 ? '★'.repeat(r) + '☆'.repeat(5 - r) : '━━━━━'}
                  </div>
                  {r > 0 && <div style={{ fontSize: 11, color: STAR_COLORS[r], marginTop: 2 }}>{STAR_LABELS[r]}</div>}
                </div>
              );
            })}
          </div>
          {form.recommend !== null && (
            <div style={{
              background: form.recommend ? '#14532d' : '#450a0a', borderRadius: 8, padding: 10,
              color: form.recommend ? '#4ade80' : '#f87171', fontSize: 14, marginBottom: 24,
            }}>
              {form.recommend ? '✅ 您表示愿意向他人推荐 OPTEC Express' : '❌ 感谢您的诚实反馈，我们会努力改进'}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={copy}
              style={{
                padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: copied ? '#14532d' : '#1e40af', color: copied ? '#4ade80' : '#93c5fd',
                fontSize: 14, fontWeight: 600, transition: 'all .2s',
              }}
            >
              {copied ? '✅ 已复制' : '📋 复制评价文本'}
            </button>
            <button
              onClick={onReset}
              style={{
                padding: '10px 24px', borderRadius: 8, border: '1px solid #1e3a5f',
                background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 14,
              }}
            >
              重新填写
            </button>
          </div>
        </div>

        {/* Copyable text preview */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, border: '1px solid #1e3a5f' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>可复制文本预览</div>
          <pre style={{
            background: '#020810', borderRadius: 8, padding: 14,
            fontSize: 11, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            color: '#94a3b8', border: '1px solid #1e3a5f',
          }}>{summary}</pre>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [form, setForm] = useState<FormData>(initForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const setRating = (key: DimKey, val: number) =>
    setForm(f => ({ ...f, ratings: { ...f.ratings, [key]: val } }));

  const setComment = (key: DimKey, val: string) =>
    setForm(f => ({ ...f, comments: { ...f.comments, [key]: val } }));

  const validate = () => {
    const errs: string[] = [];
    const filled = Object.values(form.ratings).filter(v => v > 0).length;
    if (filled < 2) errs.push('请至少评价2个维度');
    return errs;
  };

  const submit = () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSubmitted(true);
  };

  if (submitted) return <ThankYou form={form} onReset={() => { setForm(initForm()); setSubmitted(false); }} />;

  const INP: React.CSSProperties = {
    background: '#020810', border: '1px solid #1e3a5f', borderRadius: 6,
    color: '#e2e8f0', padding: '8px 12px', width: '100%', fontSize: 13,
  };
  const TA: React.CSSProperties = { ...INP, resize: 'vertical', minHeight: 72 };

  return (
    <div style={{ minHeight: '100vh', padding: '28px 20px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⭐ 服务满意度评价</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>感谢您使用 OPTEC Express 物流服务，请分享您的体验</div>
        </div>

        {/* Basic Info */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e3a5f' }}>
          <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 14 }}>📋 基本信息（选填）</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>案件号</div>
              <input style={INP} placeholder="OPT-2026-XXXX" value={form.caseNo}
                onChange={e => setForm(f => ({ ...f, caseNo: e.target.value }))} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>客户名称</div>
              <input style={INP} placeholder="贵公司名称" value={form.customer}
                onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Star Ratings */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e3a5f' }}>
          <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 16 }}>⭐ 各项评分</div>
          {DIMS.map((d, i) => (
            <div key={d.key} style={{ marginBottom: i < DIMS.length - 1 ? 20 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>{d.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{d.label}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{d.desc}</span>
              </div>
              <StarRating value={form.ratings[d.key]} onChange={v => setRating(d.key, v)} />
              {form.ratings[d.key] > 0 && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    style={{ ...TA, minHeight: 56 }}
                    placeholder={`关于${d.label}的具体意见（选填）`}
                    value={form.comments[d.key]}
                    onChange={e => setComment(d.key, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Overall comment */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, marginBottom: 16, border: '1px solid #1e3a5f' }}>
          <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 14 }}>💬 综合意见（选填）</div>
          <textarea
            style={TA}
            placeholder="请分享您对本次服务的综合感受、建议或意见..."
            value={form.overall_comment}
            onChange={e => setForm(f => ({ ...f, overall_comment: e.target.value }))}
          />
        </div>

        {/* Recommend */}
        <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid #1e3a5f' }}>
          <div style={{ fontWeight: 600, color: '#93c5fd', marginBottom: 14 }}>🙋 是否推荐</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[true, false].map(v => (
              <button
                key={String(v)}
                onClick={() => setForm(f => ({ ...f, recommend: f.recommend === v ? null : v }))}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  border: form.recommend === v
                    ? `2px solid ${v ? '#22c55e' : '#ef4444'}`
                    : '2px solid #1e3a5f',
                  background: form.recommend === v
                    ? (v ? '#14532d' : '#450a0a')
                    : '#020810',
                  color: form.recommend === v
                    ? (v ? '#4ade80' : '#f87171')
                    : '#64748b',
                  transition: 'all .2s',
                }}
              >
                {v ? '✅ 会推荐给他人' : '❌ 暂不推荐'}
              </button>
            ))}
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 8, padding: 12, marginBottom: 16 }}>
            {errors.map((e, i) => <div key={i} style={{ color: '#f87171', fontSize: 13 }}>⚠️ {e}</div>)}
          </div>
        )}

        <button
          onClick={submit}
          style={{
            width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #1e40af, #0ea5e9)',
            color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: 1,
          }}
        >
          提交评价 →
        </button>
      </div>
    </div>
  );
}
