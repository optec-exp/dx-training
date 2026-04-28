'use client';

import { useState, useMemo } from 'react';

const SUPPLIERS = [
  '国泰航空 (CX)', '日本航空 (JL)', '全日本航空 (NH)',
  '新加坡航空 (SQ)', '阿联酋航空 (EK)', '汉莎航空 (LH)',
  '大韩航空 (KE)', '泰国航空 (TG)', '马来西亚航空 (MH)',
  '中国国际航空 (CA)', '中国东方航空 (MU)', '中国南方航空 (CZ)',
  'DHL Express', 'FedEx', 'UPS', '顺丰国际',
];

const CRITERIA = [
  { key: 'punctuality', label: '准时性',  desc: '航班/交货是否按时' },
  { key: 'packaging',   label: '包装',    desc: '货物包装完好程度' },
  { key: 'documents',   label: '文件',    desc: '单据准确完整程度' },
  { key: 'communication', label: '沟通',  desc: '响应速度与沟通质量' },
] as const;

type CriteriaKey = typeof CRITERIA[number]['key'];

interface ScoreForm {
  supplier: string;
  punctuality: number;
  packaging: number;
  documents: number;
  communication: number;
  note: string;
}

interface ScoreRecord {
  id: number;
  date: string;
  supplier: string;
  scores: { [K in CriteriaKey]: number };
  average: number;
  grade: 'A' | 'B' | 'C';
  note: string;
}

const EMPTY: ScoreForm = { supplier: '', punctuality: 0, packaging: 0, documents: 0, communication: 0, note: '' };

function calcGrade(avg: number): 'A' | 'B' | 'C' {
  if (avg >= 4.0) return 'A';
  if (avg >= 2.5) return 'B';
  return 'C';
}

const GRADE_STYLE = {
  A: { color: '#4caf50', bg: 'rgba(76,175,80,0.15)',  border: 'rgba(76,175,80,0.5)',  label: 'A 优秀' },
  B: { color: '#f0c040', bg: 'rgba(240,192,64,0.15)', border: 'rgba(240,192,64,0.5)', label: 'B 良好' },
  C: { color: '#e05555', bg: 'rgba(224,85,85,0.15)',  border: 'rgba(224,85,85,0.5)',  label: 'C 待改善' },
};

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 26, lineHeight: 1, padding: '2px',
            color: s <= (hover || value) ? '#f0c040' : 'rgba(255,255,255,0.15)',
            transition: 'color 0.15s',
          }}
        >
          ★
        </button>
      ))}
      {value > 0 && (
        <span style={{ fontSize: 13, color: 'var(--text-dim)', alignSelf: 'center', marginLeft: 4 }}>
          {value} 分
        </span>
      )}
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState<ScoreForm>(EMPTY);
  const [records, setScoreRecords] = useState<ScoreRecord[]>([]);
  const [filterSupplier, setFilterSupplier] = useState('全部');
  const [submitted, setSubmitted] = useState(false);

  const average = useMemo(() => {
    const vals = CRITERIA.map((c) => form[c.key]).filter((v) => v > 0);
    if (vals.length === 0) return 0;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [form]);

  const allFilled = CRITERIA.every((c) => form[c.key] > 0) && form.supplier !== '';

  function handleSubmit() {
    if (!allFilled) return;
    const avg = parseFloat(average.toFixed(2));
    const newScoreRecord: ScoreRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString('zh-CN'),
      supplier: form.supplier,
      scores: {
        punctuality: form.punctuality,
        packaging: form.packaging,
        documents: form.documents,
        communication: form.communication,
      },
      average: avg,
      grade: calcGrade(avg),
      note: form.note,
    };
    setScoreRecords((prev) => [newScoreRecord, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setForm(EMPTY);
      setSubmitted(false);
    }, 2000);
  }

  const suppliers = useMemo(() => {
    const set = new Set(records.map((r) => r.supplier));
    return ['全部', ...Array.from(set)];
  }, [records]);

  const filtered = useMemo(() => {
    if (filterSupplier === '全部') return records;
    return records.filter((r) => r.supplier === filterSupplier);
  }, [records, filterSupplier]);

  const grade = calcGrade(average);
  const gs = GRADE_STYLE[grade];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{ background: 'var(--dark2)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · SUPPLIER QUALITY
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            航司 / 供应商品质评分表
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            每次合作后留存评分记录 · Supplier Quality Scorecard
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Score Form */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '28px' }}>
          <h2 style={{ fontSize: 15, color: 'var(--gold)', marginBottom: 22, fontFamily: 'Georgia, serif' }}>
            新增评分
          </h2>

          {/* Supplier Select */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 8 }}>
              航司 / 供应商 <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <select
              value={form.supplier}
              onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
              style={{
                width: '100%', background: 'var(--dark2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px', color: form.supplier ? 'var(--text)' : 'var(--text-dim)',
                fontSize: 14, outline: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif',
              }}
            >
              <option value="">请选择航司 / 供应商</option>
              {SUPPLIERS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Criteria */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <label style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{c.label}</label>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.desc}</span>
                </div>
                <StarRow value={form[c.key]} onChange={(v) => setForm((p) => ({ ...p, [c.key]: v }))} />
              </div>
            ))}
          </div>

          {/* Live Score Preview */}
          {average > 0 && (
            <div style={{
              background: 'var(--dark2)', border: `1px solid ${gs.border}`,
              borderRadius: 10, padding: '14px 18px', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4 }}>综合评分</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: gs.color }}>{average.toFixed(2)}</div>
              </div>
              <div style={{
                fontSize: 22, fontWeight: 700, color: gs.color,
                background: gs.bg, border: `1px solid ${gs.border}`,
                borderRadius: 10, padding: '8px 20px',
              }}>
                {gs.label}
              </div>
            </div>
          )}

          {/* Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--gold)', marginBottom: 8 }}>
              备注 <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>（选填）</span>
            </label>
            <textarea
              rows={2}
              placeholder="本次合作的特别情况或改善建议..."
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              style={{
                width: '100%', background: 'var(--dark2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
                fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'Georgia, serif', lineHeight: 1.6,
              }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!allFilled}
            style={{
              width: '100%', padding: '13px', borderRadius: 10, border: 'none',
              background: submitted ? 'rgba(76,175,80,0.3)'
                : allFilled ? 'linear-gradient(90deg, var(--gold), #e8c99a)'
                : 'rgba(201,169,110,0.2)',
              color: submitted ? '#4caf50' : allFilled ? 'var(--dark)' : 'rgba(201,169,110,0.4)',
              fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700,
              cursor: allFilled ? 'pointer' : 'default',
              transition: 'all 0.3s',
            }}
          >
            {submitted ? '✓ 已记录' : '提交评分'}
          </button>
        </div>

        {/* ScoreRecords */}
        <div>
          {/* Filter */}
          {records.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {suppliers.map((s) => (
                <button key={s} onClick={() => setFilterSupplier(s)} style={{
                  padding: '5px 14px', borderRadius: 20, border: '1px solid',
                  borderColor: filterSupplier === s ? 'var(--gold)' : 'var(--border)',
                  background: filterSupplier === s ? 'var(--gold)' : 'transparent',
                  color: filterSupplier === s ? 'var(--dark)' : 'var(--text-dim)',
                  fontFamily: 'Georgia, serif', fontSize: 12,
                  fontWeight: filterSupplier === s ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* ScoreRecord Cards */}
          {filtered.length === 0 ? (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '48px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 14,
            }}>
              暂无评分记录<br />
              <span style={{ fontSize: 12, marginTop: 8, display: 'block' }}>提交第一条评分后将在此显示</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((r) => {
                const g = GRADE_STYLE[r.grade];
                return (
                  <div key={r.id} style={{
                    background: 'var(--card)', border: `1px solid ${g.border}`,
                    borderRadius: 12, padding: '18px 20px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{r.supplier}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.date}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 22, fontWeight: 700, color: g.color }}>{r.average.toFixed(2)}</span>
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: g.color,
                          background: g.bg, border: `1px solid ${g.border}`,
                          borderRadius: 8, padding: '4px 12px',
                        }}>{g.label}</span>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: r.note ? 10 : 0 }}>
                      {CRITERIA.map((c) => (
                        <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.label}</span>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {[1,2,3,4,5].map((s) => (
                              <span key={s} style={{ fontSize: 13, color: s <= r.scores[c.key] ? '#f0c040' : 'rgba(255,255,255,0.12)' }}>★</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {r.note && (
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                        备注：{r.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 12, marginTop: 20 }}>
        OPTEC Express · Supplier Quality Scorecard · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
