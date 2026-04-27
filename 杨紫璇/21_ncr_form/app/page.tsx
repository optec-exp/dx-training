'use client';

import { useState, useMemo } from 'react';

const ISSUE_TYPES = ['破损', '温超', '延误', '文件错误', '包装不良', '短装/多装'];

const SEVERITY_LEVELS = [
  { value: 'S4', label: 'S4 严重', color: '#e05555', bg: 'rgba(224,85,85,0.12)', border: 'rgba(224,85,85,0.5)' },
  { value: 'S3', label: 'S3 高',   color: '#f0a040', bg: 'rgba(240,160,64,0.12)', border: 'rgba(240,160,64,0.5)' },
  { value: 'S2', label: 'S2 中',   color: '#f0c040', bg: 'rgba(240,192,64,0.12)', border: 'rgba(240,192,64,0.5)' },
  { value: 'S1', label: 'S1 低',   color: '#4caf50', bg: 'rgba(76,175,80,0.12)',  border: 'rgba(76,175,80,0.5)' },
];

interface FormData {
  date: string;
  flight: string;
  awb: string;
  issueType: string;
  severity: string;
  description: string;
}

const EMPTY: FormData = { date: '', flight: '', awb: '', issueType: '', severity: '', description: '' };

const REQUIRED_FIELDS: (keyof FormData)[] = ['date', 'flight', 'awb', 'issueType', 'severity'];

function genNcrNo(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `NCR-2026-${num}`;
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: 'var(--dark2)',
    border: `1px solid ${hasError ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 8,
    padding: '10px 14px',
    color: 'var(--text)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
  };
}

export default function Home() {
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState<{ ncrNo: string; data: FormData } | null>(null);
  const [records, setRecords] = useState<Array<{ ncrNo: string; data: FormData }>>([]);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  const completionPct = useMemo(() => {
    const filled = REQUIRED_FIELDS.filter((f) => form[f].trim() !== '').length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  }, [form]);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.date) newErrors.date = '请选择发生日期';
    if (!form.flight.trim()) newErrors.flight = '请输入航班号';
    if (!form.awb.trim()) newErrors.awb = '请输入AWB编号';
    if (!form.issueType) newErrors.issueType = '请选择异常类型';
    if (!form.severity) newErrors.severity = '请选择严重等级';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    const ncrNo = genNcrNo();
    const record = { ncrNo, data: { ...form } };
    setSubmitted(record);
    setRecords((prev) => [record, ...prev]);
    setForm(EMPTY);
    setErrors({});
  }

  function handleNew() {
    setSubmitted(null);
  }

  const selectedSeverity = SEVERITY_LEVELS.find((s) => s.value === form.severity);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--dark2)',
        borderBottom: '1px solid var(--border)',
        padding: '24px 32px',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · NCR SYSTEM
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            NCR 快速登录表单
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            不符合报告一键提交 · Non-Conformance Report
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>

        {/* Success Screen */}
        {submitted ? (
          <div style={{
            background: 'var(--card)',
            border: '1px solid rgba(76,175,80,0.5)',
            borderRadius: 16,
            padding: '40px 36px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>NCR 已成功登录，编号为</div>
            <div style={{
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--gold)',
              fontFamily: 'Georgia, serif',
              letterSpacing: 2,
              marginBottom: 28,
            }}>
              {submitted.ncrNo}
            </div>

            {/* Summary */}
            <div style={{
              background: 'var(--dark2)',
              borderRadius: 10,
              padding: '16px 20px',
              marginBottom: 28,
              textAlign: 'left',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 24px',
            }}>
              {[
                { label: '发生日期', value: submitted.data.date },
                { label: '航班号', value: submitted.data.flight },
                { label: 'AWB', value: submitted.data.awb },
                { label: '异常类型', value: submitted.data.issueType },
                { label: '严重等级', value: SEVERITY_LEVELS.find(s => s.value === submitted.data.severity)?.label ?? '' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{value}</div>
                </div>
              ))}
              {submitted.data.description && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>备注</div>
                  <div style={{ fontSize: 14, color: 'var(--text)' }}>{submitted.data.description}</div>
                </div>
              )}
            </div>

            <button
              onClick={handleNew}
              style={{
                padding: '12px 36px',
                borderRadius: 8,
                border: '1px solid var(--gold)',
                background: 'var(--gold)',
                color: 'var(--dark)',
                fontFamily: 'Georgia, serif',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + 登录新的 NCR
            </button>
          </div>
        ) : (

          /* Form */
          <form onSubmit={handleSubmit} noValidate>

            {/* Progress */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>表单完成率</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${completionPct}%`,
                  background: 'linear-gradient(90deg, var(--gold), var(--gold-light, #e8c99a))',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold)', minWidth: 40, textAlign: 'right' }}>
                {completionPct}%
              </span>
            </div>

            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
            }}>

              {/* Row 1: Date + Flight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 6 }}>
                    发生日期 <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                    style={{ ...inputStyle(!!errors.date), colorScheme: 'dark' }}
                  />
                  {errors.date && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{errors.date}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 6 }}>
                    航班号 <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例：CX880"
                    value={form.flight}
                    onChange={(e) => set('flight', e.target.value)}
                    style={inputStyle(!!errors.flight)}
                  />
                  {errors.flight && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{errors.flight}</p>}
                </div>
              </div>

              {/* Row 2: AWB + Issue Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 6 }}>
                    AWB 编号 <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="例：160-12345678"
                    value={form.awb}
                    onChange={(e) => set('awb', e.target.value)}
                    style={inputStyle(!!errors.awb)}
                  />
                  {errors.awb && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{errors.awb}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 6 }}>
                    异常类型 <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <select
                    value={form.issueType}
                    onChange={(e) => set('issueType', e.target.value)}
                    style={{ ...inputStyle(!!errors.issueType), cursor: 'pointer' }}
                  >
                    <option value="">请选择异常类型</option>
                    {ISSUE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.issueType && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{errors.issueType}</p>}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 10 }}>
                  严重等级 <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {SEVERITY_LEVELS.map((s) => {
                    const active = form.severity === s.value;
                    return (
                      <button
                        type="button"
                        key={s.value}
                        onClick={() => set('severity', s.value)}
                        style={{
                          padding: '10px 22px',
                          borderRadius: 8,
                          border: `1px solid ${active ? s.border : 'var(--border)'}`,
                          background: active ? s.bg : 'transparent',
                          color: active ? s.color : 'var(--text-dim)',
                          fontFamily: 'Georgia, serif',
                          fontSize: 14,
                          fontWeight: active ? 700 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          flex: 1,
                          minWidth: 100,
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
                {errors.severity && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 6 }}>{errors.severity}</p>}
                {selectedSeverity && (
                  <p style={{ fontSize: 12, color: selectedSeverity.color, marginTop: 8 }}>
                    已选：{selectedSeverity.label}
                    {selectedSeverity.value === 'S4' && ' — 需立即上报处理'}
                    {selectedSeverity.value === 'S3' && ' — 需24小时内响应'}
                    {selectedSeverity.value === 'S2' && ' — 需72小时内响应'}
                    {selectedSeverity.value === 'S1' && ' — 纳入例行改善'}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 6 }}>
                  备注说明 <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>（选填）</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="详细描述异常情况、初步原因分析等..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  style={{
                    ...inputStyle(false),
                    resize: 'vertical',
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 10,
                  border: 'none',
                  background: completionPct === 100
                    ? 'linear-gradient(90deg, var(--gold), #e8c99a)'
                    : 'rgba(201,169,110,0.3)',
                  color: completionPct === 100 ? 'var(--dark)' : 'rgba(201,169,110,0.5)',
                  fontFamily: 'Georgia, serif',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  letterSpacing: 1,
                }}
              >
                提交 NCR 报告
              </button>
            </div>
          </form>
        )}

        {/* Records */}
        {records.length > 0 && !submitted && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 15, color: 'var(--gold)', marginBottom: 14, fontFamily: 'Georgia, serif' }}>
              本次会话登录记录（{records.length} 条）
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {records.map((r) => {
                const sev = SEVERITY_LEVELS.find((s) => s.value === r.data.severity);
                return (
                  <div key={r.ncrNo} style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 14 }}>{r.ncrNo}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{r.data.date}</span>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{r.data.issueType}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{r.data.flight} · {r.data.awb}</span>
                    {sev && (
                      <span style={{
                        fontSize: 12,
                        color: sev.color,
                        background: sev.bg,
                        border: `1px solid ${sev.border}`,
                        borderRadius: 20,
                        padding: '2px 10px',
                        marginLeft: 'auto',
                      }}>
                        {sev.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-dim)',
        fontSize: 12,
        marginTop: 20,
      }}>
        OPTEC Express · NCR Quick Entry System · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
