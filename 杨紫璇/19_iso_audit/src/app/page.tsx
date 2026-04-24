'use client';

import { useState, useMemo } from 'react';
import { DEPARTMENTS, type Verdict } from '@/data/checklist';

const VERDICT_OPTIONS: { value: Verdict; label: string; color: string }[] = [
  { value: '✓', label: '✓ 符合', color: '#4caf50' },
  { value: '▽', label: '▽ 轻微不符合', color: '#f0c040' },
  { value: '×', label: '× 严重不符合', color: '#e05555' },
];

export default function Home() {
  const [verdicts, setVerdicts] = useState<Record<number, Verdict>>({});
  const [activeDept, setActiveDept] = useState<string>('全部');

  const allDepts = ['全部', ...DEPARTMENTS.map((d) => d.name)];

  const visibleDepts = useMemo(() => {
    if (activeDept === '全部') return DEPARTMENTS;
    return DEPARTMENTS.filter((d) => d.name === activeDept);
  }, [activeDept]);

  const totalItems = DEPARTMENTS.reduce((sum, d) => sum + d.items.length, 0);
  const answeredItems = Object.values(verdicts).filter((v) => v !== null).length;
  const completionPct = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;

  const conformCount = Object.values(verdicts).filter((v) => v === '✓').length;
  const minorCount = Object.values(verdicts).filter((v) => v === '▽').length;
  const majorCount = Object.values(verdicts).filter((v) => v === '×').length;

  function setVerdict(id: number, val: Verdict) {
    setVerdicts((prev) => {
      if (prev[id] === val) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: val };
    });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--dark2)',
        borderBottom: '1px solid var(--border)',
        padding: '24px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · ISO 9001:2015
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            内部审计检查清单
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            山东上星国际货运代理有限公司 · Internal Quality Audit Checklist
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats Bar */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 40,
          flexWrap: 'wrap',
        }}>
          {/* Progress */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>审核完成率</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{completionPct}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${completionPct}%`,
                background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
              {answeredItems} / {totalItems} 条已评定
            </div>
          </div>

          {/* Verdict counts */}
          <div style={{ display: 'flex', gap: 24 }}>
            {[
              { label: '符合', count: conformCount, color: '#4caf50' },
              { label: '轻微不符合', count: minorCount, color: '#f0c040' },
              { label: '严重不符合', count: majorCount, color: '#e05555' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dept Filter */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          {allDepts.map((dept) => (
            <button
              key={dept}
              onClick={() => setActiveDept(dept)}
              style={{
                padding: '8px 20px',
                borderRadius: 24,
                border: '1px solid',
                borderColor: activeDept === dept ? 'var(--gold)' : 'var(--border)',
                background: activeDept === dept ? 'var(--gold)' : 'transparent',
                color: activeDept === dept ? 'var(--dark)' : 'var(--text-dim)',
                fontFamily: 'Georgia, serif',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: activeDept === dept ? 700 : 400,
                transition: 'all 0.2s',
              }}
            >
              {dept}
            </button>
          ))}
        </div>

        {/* Department Sections */}
        {visibleDepts.map((dept) => {
          const deptAnswered = dept.items.filter((i) => verdicts[i.id] != null).length;
          const deptPct = Math.round((deptAnswered / dept.items.length) * 100);

          return (
            <div key={dept.id} style={{ marginBottom: 32 }}>
              {/* Dept Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '1px solid var(--border)',
              }}>
                <h2 style={{ fontSize: 18, color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
                  {dept.name}
                </h2>
                <span style={{
                  fontSize: 12,
                  color: deptPct === 100 ? '#4caf50' : 'var(--text-dim)',
                  background: 'rgba(255,255,255,0.05)',
                  padding: '3px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  {deptPct}% · {deptAnswered}/{dept.items.length}
                </span>
              </div>

              {/* Check Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {dept.items.map((item) => {
                  const current = verdicts[item.id] ?? null;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: 'var(--card)',
                        border: '1px solid',
                        borderColor: current === '✓' ? 'rgba(76,175,80,0.4)'
                          : current === '▽' ? 'rgba(240,192,64,0.4)'
                          : current === '×' ? 'rgba(224,85,85,0.4)'
                          : 'var(--border)',
                        borderRadius: 10,
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 16,
                        transition: 'border-color 0.2s',
                      }}
                    >
                      {/* Clause badge */}
                      <div style={{
                        minWidth: 52,
                        background: 'rgba(201,169,110,0.12)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '4px 8px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--gold)',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {item.clause}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 6 }}>
                          {item.requirement}
                        </p>
                        <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          证据：{item.evidence}
                        </p>
                      </div>

                      {/* Verdict Buttons */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                        {VERDICT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value!}
                            onClick={() => setVerdict(item.id, opt.value)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 6,
                              border: '1px solid',
                              borderColor: current === opt.value ? opt.color : 'rgba(255,255,255,0.15)',
                              background: current === opt.value ? opt.color + '22' : 'transparent',
                              color: current === opt.value ? opt.color : 'rgba(255,255,255,0.4)',
                              fontSize: 12,
                              cursor: 'pointer',
                              fontFamily: 'Georgia, serif',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.2s',
                              fontWeight: current === opt.value ? 700 : 400,
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-dim)',
        fontSize: 12,
        marginTop: 20,
      }}>
        OPTEC Express · ISO 9001:2015 Internal Audit · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
