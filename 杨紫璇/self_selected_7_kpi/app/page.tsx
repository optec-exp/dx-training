'use client';

import { useState, useEffect, useMemo } from 'react';

interface MonthData {
  onTimeRate: number;
  anomalyRate: number;
  ncrCloseRate: number;
  complaints: number;
}

interface KpiData {
  [month: string]: MonthData;
}

interface KpiDef {
  key: keyof MonthData;
  label: string;
  unit: string;
  target: number;
  direction: 'higher' | 'lower';
  description: string;
  format: (v: number) => string;
  targetLabel: string;
  max: number;
}

const KPI_DEFS: KpiDef[] = [
  {
    key: 'onTimeRate',
    label: '准时率',
    unit: '%',
    target: 95,
    direction: 'higher',
    description: '航班/交货按时送达比例',
    format: (v) => `${v.toFixed(1)}%`,
    targetLabel: '目标 ≥ 95%',
    max: 100,
  },
  {
    key: 'anomalyRate',
    label: '货物异常率',
    unit: '%',
    target: 1.0,
    direction: 'lower',
    description: '发生异常的货物件数占比',
    format: (v) => `${v.toFixed(1)}%`,
    targetLabel: '目标 ≤ 1.0%',
    max: 5,
  },
  {
    key: 'ncrCloseRate',
    label: 'NCR 关闭率',
    unit: '%',
    target: 90,
    direction: 'higher',
    description: '当月NCR在期限内关闭比例',
    format: (v) => `${v.toFixed(1)}%`,
    targetLabel: '目标 ≥ 90%',
    max: 100,
  },
  {
    key: 'complaints',
    label: '客户投诉件数',
    unit: '件',
    target: 5,
    direction: 'lower',
    description: '当月收到的客户正式投诉',
    format: (v) => `${v} 件`,
    targetLabel: '目标 ≤ 5 件',
    max: 15,
  },
];

function isMet(value: number, target: number, direction: 'higher' | 'lower'): boolean {
  return direction === 'higher' ? value >= target : value <= target;
}

export default function Home() {
  const [kpiData, setKpiData] = useState<KpiData>({});
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    fetch('/data/kpi.json')
      .then((r) => r.json())
      .then((d: KpiData) => {
        setKpiData(d);
        const months = Object.keys(d).sort();
        setSelectedMonth(months[months.length - 1] ?? '');
      });
  }, []);

  const months = useMemo(() => Object.keys(kpiData).sort(), [kpiData]);
  const current = kpiData[selectedMonth];

  const metCount = useMemo(() => {
    if (!current) return 0;
    return KPI_DEFS.filter((k) => isMet(current[k.key], k.target, k.direction)).length;
  }, [current]);

  // trend vs previous month
  const prevMonth = useMemo(() => {
    const idx = months.indexOf(selectedMonth);
    return idx > 0 ? kpiData[months[idx - 1]] : null;
  }, [months, selectedMonth, kpiData]);

  function trendIcon(key: keyof MonthData, direction: 'higher' | 'lower'): { icon: string; color: string } | null {
    if (!prevMonth || !current) return null;
    const diff = current[key] - prevMonth[key];
    if (Math.abs(diff) < 0.01) return null;
    const improved = direction === 'higher' ? diff > 0 : diff < 0;
    return { icon: diff > 0 ? '▲' : '▼', color: improved ? 'var(--green)' : 'var(--red)' };
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{ background: 'var(--dark2)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · QUALITY KPI DASHBOARD
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            月度品质 KPI 仪表盘
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            准时率 · 异常件数 · NCR完成率 · 数据来源：kpi.json
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

        {/* Month Selector + Overall */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {months.map((m) => (
              <button key={m} onClick={() => setSelectedMonth(m)} style={{
                padding: '7px 20px', borderRadius: 24,
                border: `1px solid ${selectedMonth === m ? 'var(--gold)' : 'var(--border)'}`,
                background: selectedMonth === m ? 'var(--gold)' : 'transparent',
                color: selectedMonth === m ? 'var(--dark)' : 'var(--text-dim)',
                fontFamily: 'Georgia, serif', fontSize: 13,
                fontWeight: selectedMonth === m ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {m}
              </button>
            ))}
          </div>
          {current && (
            <div style={{
              background: 'var(--card)', border: `1px solid ${metCount === 4 ? 'rgba(76,175,80,0.5)' : 'var(--border)'}`,
              borderRadius: 10, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>达标指标</span>
              <span style={{
                fontSize: 22, fontWeight: 700,
                color: metCount === 4 ? 'var(--green)' : metCount >= 3 ? '#f0c040' : 'var(--red)',
              }}>
                {metCount} / 4
              </span>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        {current ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {KPI_DEFS.map((kpi) => {
              const value = current[kpi.key];
              const met = isMet(value, kpi.target, kpi.direction);
              const color = met ? 'var(--green)' : 'var(--red)';
              const barBg = met ? 'rgba(76,175,80,0.15)' : 'rgba(224,85,85,0.1)';
              const barFill = met ? 'var(--green)' : 'var(--red)';
              const barBorder = met ? 'rgba(76,175,80,0.4)' : 'rgba(224,85,85,0.4)';
              const barWidth = Math.min((value / kpi.max) * 100, 100);
              const targetWidth = Math.min((kpi.target / kpi.max) * 100, 100);
              const trend = trendIcon(kpi.key, kpi.direction);

              return (
                <div key={kpi.key} style={{
                  background: 'var(--card)',
                  border: `1px solid ${barBorder}`,
                  borderRadius: 14, padding: '24px',
                  transition: 'border-color 0.3s',
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>{kpi.label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 38, fontWeight: 700, color, lineHeight: 1 }}>
                          {kpi.format(value)}
                        </span>
                        {trend && (
                          <span style={{ fontSize: 13, color: trend.color, fontWeight: 600 }}>
                            {trend.icon}
                          </span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: met ? 'var(--green)' : 'var(--red)',
                      background: barBg,
                      border: `1px solid ${barBorder}`,
                      borderRadius: 20, padding: '4px 14px',
                    }}>
                      {met ? '✓ 达标' : '✗ 未达标'}
                    </span>
                  </div>

                  {/* Progress bar with target marker */}
                  <div style={{ position: 'relative', marginBottom: 10 }}>
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'visible', position: 'relative' }}>
                      <div style={{
                        height: '100%', width: `${barWidth}%`,
                        background: barFill, borderRadius: 5,
                        transition: 'width 0.6s ease',
                      }} />
                      {/* Target marker */}
                      <div style={{
                        position: 'absolute', top: -3, left: `${targetWidth}%`,
                        width: 2, height: 16,
                        background: 'var(--gold)', borderRadius: 1,
                        transform: 'translateX(-50%)',
                      }} />
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{kpi.description}</span>
                    <span style={{ fontSize: 11, color: 'var(--gold)' }}>{kpi.targetLabel}</span>
                  </div>

                  {/* Prev month comparison */}
                  {prevMonth && (
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      上月：{kpi.format(prevMonth[kpi.key])}
                      <span style={{ marginLeft: 8, color: trend?.color ?? 'var(--text-dim)' }}>
                        {trend ? `${trend.icon} ${Math.abs(current[kpi.key] - prevMonth[kpi.key]).toFixed(1)}${kpi.unit}` : '持平'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>加载中…</div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: 12, marginTop: 20 }}>
        OPTEC Express · Monthly Quality KPI Dashboard · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
