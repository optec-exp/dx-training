'use client';

import { useState, useMemo } from 'react';
import { SHIPMENTS } from '@/data/shipments';

const C = {
  bg: '#030b18', bg2: '#071428', bg3: '#0d1f3c',
  border: 'rgba(255,255,255,0.1)', text: '#e2e8f0',
  muted: '#94a3b8', sky: '#60a5fa',
};

// ── 学習点③：日付比較ユーティリティ ─────────────────────────────
function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// 残り日数 → 色・ラベル・アイコン
function getUrgency(days: number) {
  if (days < 0)  return { color: '#6b7280', label: '出発済',  icon: '✈️',  bg: '#1f293722' };
  if (days === 0) return { color: '#ef4444', label: '本日出発', icon: '🚨', bg: '#7f1d1d33' };
  if (days === 1) return { color: '#f97316', label: '明日出発', icon: '⚠️', bg: '#7c2d1233' };
  if (days <= 3)  return { color: '#eab308', label: `${days}日後`,   icon: '⏰', bg: '#78350f22' };
  return           { color: '#10b981', label: `${days}日後`,   icon: '🟢', bg: '#05291622' };
}

type FilterType = '全部' | '要注意' | '確認済';

export default function DeliveryTracker() {
  // ── 学習点①：複数チェックボックスの状態管理 ───────────────────
  // confirmedIds は「確認済みの shipment ID の Set」
  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterType>('全部');

  function toggleConfirmed(id: number) {
    setConfirmedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── 学習点②：進捗計算 ─────────────────────────────────────────
  const confirmedCount = confirmedIds.size;
  const progress       = Math.round((confirmedCount / SHIPMENTS.length) * 100);

  // ── 学習点③：日付比較で「要注意」フィルタ ────────────────────
  const filtered = useMemo(() => {
    return SHIPMENTS.filter(s => {
      const days = getDaysUntil(s.etd);
      if (filter === '確認済') return confirmedIds.has(s.id);
      if (filter === '要注意') return days >= 0 && days <= 2 && !confirmedIds.has(s.id);
      return true;
    }).sort((a, b) => a.etd.localeCompare(b.etd));
  }, [filter, confirmedIds]);

  const alertCount = SHIPMENTS.filter(s => {
    const d = getDaysUntil(s.etd);
    return d >= 0 && d <= 2 && !confirmedIds.has(s.id);
  }).length;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter','PingFang SC','Microsoft YaHei',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '24px 24px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, color: C.sky, marginBottom: 6, textTransform: 'uppercase' }}>OPTEC Express</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>配送期限追踪器</h1>
        <p style={{ fontSize: 13, color: C.muted }}>ETD / ETA 管理 — Delivery Deadline Tracker</p>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 16px' }}>

        {/* ── 学習点②：全体進捗 ── */}
        <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 22px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>确认进度</span>
              <span style={{ marginLeft: 12, fontSize: 12, color: C.muted }}>
                {confirmedCount} / {SHIPMENTS.length} 件已确认
              </span>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: progress === 100 ? '#10b981' : C.sky }}>
              {progress}%
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8,
              width: `${progress}%`,
              background: progress === 100 ? '#10b981' : '#3b82f6',
              transition: 'width 0.4s ease',
            }} />
          </div>
          {alertCount > 0 && (
            <p style={{ fontSize: 12, color: '#f97316', marginTop: 8, fontWeight: 600 }}>
              ⚠️ 有 {alertCount} 件在 2 日内出发，尚未确认
            </p>
          )}
        </div>

        {/* ── 学習点③：フィルタタブ（日付比較による分類）── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['全部', '要注意', '確認済'] as FilterType[]).map(f => {
            const isActive = filter === f;
            const color = f === '要注意' ? '#f97316' : f === '確認済' ? '#10b981' : '#3b82f6';
            const badge = f === '要注意' ? alertCount : f === '確認済' ? confirmedCount : SHIPMENTS.length;
            return (
              <button
                type="button"
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 20px', borderRadius: 24,
                  border: `2px solid ${isActive ? color : 'rgba(255,255,255,0.18)'}`,
                  background: isActive ? color + '28' : 'transparent',
                  color: isActive ? color : C.muted,
                  cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 400,
                  outline: 'none', transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {f}
                <span style={{
                  background: isActive ? color + '33' : 'rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '1px 7px', fontSize: 12, fontWeight: 700,
                }}>
                  {badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Shipment カード一覧 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(s => {
            const days       = getDaysUntil(s.etd);
            const urgency    = getUrgency(days);
            const etaDays    = getDaysUntil(s.eta);
            const isConfirmed = confirmedIds.has(s.id);

            return (
              <div
                key={s.id}
                style={{
                  background: isConfirmed ? '#0d1f3c88' : urgency.bg,
                  border: `2px solid ${isConfirmed ? 'rgba(255,255,255,0.07)' : urgency.color + '66'}`,
                  borderRadius: 14, padding: '16px 20px',
                  opacity: isConfirmed ? 0.65 : 1,
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>

                  {/* ── 学習点①：チェックボックス（確認済みトグル）── */}
                  <div style={{ paddingTop: 2, flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={() => toggleConfirmed(s.id)}
                      style={{ width: 20, height: 20, accentColor: '#10b981', cursor: 'pointer' }}
                    />
                  </div>

                  {/* 左：AWB情報 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: 0.5 }}>
                        {s.awb}
                      </span>
                      <span style={{ fontSize: 12, background: C.bg2, borderRadius: 6, padding: '2px 8px', color: C.muted }}>
                        {s.origin} → {s.dest}
                      </span>
                      <span style={{ fontSize: 12, color: C.muted }}>{s.cargo}</span>
                      <span style={{ fontSize: 11, color: '#475569' }}>C.W. {s.cw} kg</span>
                    </div>

                    {/* ETD / ETA 行 */}
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13 }}>
                      <span>
                        <span style={{ color: C.muted, fontSize: 11 }}>ETD  </span>
                        <strong style={{ color: isConfirmed ? C.muted : urgency.color }}>{s.etd}</strong>
                      </span>
                      <span>
                        <span style={{ color: C.muted, fontSize: 11 }}>ETA  </span>
                        <strong style={{ color: C.text }}>{s.eta}</strong>
                        <span style={{ color: '#475569', fontSize: 11, marginLeft: 4 }}>
                          ({etaDays >= 0 ? `${etaDays}日後到着` : '到着済'})
                        </span>
                      </span>
                    </div>

                    {s.note && (
                      <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>📌 {s.note}</p>
                    )}
                  </div>

                  {/* 右：学習点③ — 日付比較による残り日数バッジ */}
                  <div style={{
                    flexShrink: 0, textAlign: 'center',
                    background: isConfirmed ? 'rgba(255,255,255,0.05)' : urgency.bg,
                    border: `1.5px solid ${isConfirmed ? 'rgba(255,255,255,0.1)' : urgency.color + '55'}`,
                    borderRadius: 10, padding: '10px 16px', minWidth: 90,
                  }}>
                    <p style={{ fontSize: 20, margin: 0 }}>{isConfirmed ? '✅' : urgency.icon}</p>
                    <p style={{ fontSize: 11, color: isConfirmed ? '#10b981' : urgency.color, fontWeight: 700, marginTop: 4 }}>
                      {isConfirmed ? '確認済' : urgency.label}
                    </p>
                    {!isConfirmed && days >= 0 && (
                      <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                        ETD まで {days}日
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🎉</p>
              <p style={{ fontSize: 15 }}>
                {filter === '要注意' ? '暂无需要注意的案件' : '此分类暂无数据'}
              </p>
            </div>
          )}
        </div>
      </div>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: '#334155', marginTop: 20 }}>
        OPTEC Express DX室 · ETD / ETA Delivery Deadline Tracker
      </footer>
    </div>
  );
}
