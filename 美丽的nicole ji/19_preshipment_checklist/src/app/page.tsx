'use client';

import { useState, useMemo } from 'react';

// ── 学习点①：复选框数据结构 ──────────────────────────────────
// 三大分类 × 各若干条目，用二维数组管理所有勾选状态
const CHECKLIST = [
  {
    id: 'awb',
    section: 'AWB  空运单',
    icon: '📄',
    color: '#3b82f6',
    items: [
      'AWB 号码已核实并与订舱确认书一致',
      '发货人（Shipper）信息正确无误',
      '收货人（Consignee）信息正确无误',
      '品名 / 件数 / 重量与实货一致',
      'AWB 已签名 / 盖章，副本份数足够（≥ 3份）',
    ],
  },
  {
    id: 'customs',
    section: '通关  Customs',
    icon: '🛃',
    color: '#8b5cf6',
    items: [
      '商业发票（INV）已附，金额与实货一致',
      '装箱单（PL）已附，件数与实货一致',
      'HS Code 已确认，适用税率已知',
      '原产地证（CO）已附（如需）',
      'MSDS 已附（危险品 / 化学品适用）',
      '进出口许可证 / 许可文件已准备',
      '报关申报信息核实完毕，无漏报',
    ],
  },
  {
    id: 'temp',
    section: '温度管理  Temperature',
    icon: '🌡️',
    color: '#10b981',
    items: [
      '目标温度范围（℃）已与客户确认',
      '冷藏 / 冷冻舱位（F/C PAX）已预订',
      '温度记录仪已放置并启动记录',
      '保冷材料（ドライアイス等）准备充足',
      '货物交接时实测温度已记录并签字',
    ],
  },
];

const TOTAL = CHECKLIST.reduce((s, g) => s + g.items.length, 0);

const C = {
  bg: '#030b18', bg2: '#071428', bg3: '#0d1f3c',
  border: 'rgba(255,255,255,0.1)', text: '#e2e8f0',
  muted: '#94a3b8', sky: '#60a5fa',
};

export default function PreShipmentChecklist() {
  // ── 学习点①：复选框状态管理 ───────────────────────────────────
  // checked[sectionIdx][itemIdx] = true/false
  const [checked, setChecked] = useState<boolean[][]>(
    CHECKLIST.map(g => Array(g.items.length).fill(false))
  );

  const [etd, setEtd]     = useState('');
  const [awbNo, setAwbNo] = useState('');
  const [dest, setDest]   = useState('');

  // チェック切り替え
  function toggle(si: number, ii: number) {
    setChecked(prev =>
      prev.map((row, s) =>
        s === si ? row.map((v, i) => (i === ii ? !v : v)) : row
      )
    );
  }

  // セクション全選択 / 全解除
  function toggleSection(si: number) {
    const allChecked = checked[si].every(Boolean);
    setChecked(prev =>
      prev.map((row, s) =>
        s === si ? row.map(() => !allChecked) : row
      )
    );
  }

  // ── 学習点②：進捗計算 ────────────────────────────────────────
  const checkedCount = useMemo(() => checked.flat().filter(Boolean).length, [checked]);
  const progress     = Math.round((checkedCount / TOTAL) * 100);
  const sectionProgress = CHECKLIST.map((g, si) => {
    const c = checked[si].filter(Boolean).length;
    return { checked: c, total: g.items.length, pct: Math.round((c / g.items.length) * 100) };
  });

  // ── 学習点③：日付比較・警告表示 ──────────────────────────────
  const daysUntilEtd = useMemo(() => {
    if (!etd) return null;
    const diff = (new Date(etd).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff;
  }, [etd]);

  const urgencyLevel =
    daysUntilEtd === null ? 'none' :
    daysUntilEtd < 0      ? 'overdue' :
    daysUntilEtd < 1      ? 'critical' :
    daysUntilEtd < 3      ? 'warning' : 'normal';

  const allDone = checkedCount === TOTAL;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter','PingFang SC','Microsoft YaHei',sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '24px 24px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: 11, letterSpacing: 4, color: C.sky, marginBottom: 6, textTransform: 'uppercase' }}>OPTEC Express</p>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>出货前确认检查清单</h1>
        <p style={{ fontSize: 13, color: C.muted }}>AWB · 通关 · 温度管理 — Pre-Shipment Checklist</p>
      </header>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 16px' }}>

        {/* ── 案件基本情報 ── */}
        <div style={{
          background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '18px 20px', marginBottom: 24, display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
        }}>
          {[
            { label: 'AWB 号码', value: awbNo, set: setAwbNo, placeholder: 'e.g. CA 123-45678901' },
            { label: 'ETD（预计起飞）', value: etd,   set: setEtd,   placeholder: '', type: 'date' },
            { label: '目的地 Dest.',   value: dest,  set: setDest,  placeholder: 'e.g. NRT / Tokyo' },
          ].map(({ label, value, set, placeholder, type }) => (
            <div key={label}>
              <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{label}</p>
              <input
                type={type ?? 'text'}
                value={value}
                onChange={e => set(e.target.value)}
                placeholder={placeholder}
                style={{
                  width: '100%', padding: '8px 10px', background: C.bg2,
                  border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 7,
                  color: C.text, fontSize: 13, outline: 'none', colorScheme: 'dark',
                }}
              />
            </div>
          ))}
        </div>

        {/* ── 学習点③：ETD警告バナー ── */}
        {urgencyLevel !== 'none' && urgencyLevel !== 'normal' && !allDone && (
          <div style={{
            marginBottom: 20, padding: '12px 18px', borderRadius: 10,
            background: urgencyLevel === 'overdue'  ? '#7f1d1d33' :
                        urgencyLevel === 'critical' ? '#7c2d1233' : '#78350f33',
            border: `1.5px solid ${
              urgencyLevel === 'overdue'  ? '#ef4444' :
              urgencyLevel === 'critical' ? '#f97316' : '#eab308'
            }`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 22 }}>
              {urgencyLevel === 'overdue' ? '🚨' : urgencyLevel === 'critical' ? '⚠️' : '⏰'}
            </span>
            <div>
              <p style={{ fontWeight: 700, color: urgencyLevel === 'overdue' ? '#ef4444' : urgencyLevel === 'critical' ? '#f97316' : '#eab308', fontSize: 14 }}>
                {urgencyLevel === 'overdue'  ? '期限超过！立刻完成剩余确认项目' :
                 urgencyLevel === 'critical' ? '24小时以内起飞！尽快完成所有确认' :
                                              '距离 ETD 不足 3 天，请加快确认进度'}
              </p>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                还剩 {TOTAL - checkedCount} 项未完成 · ETD: {etd}
              </p>
            </div>
          </div>
        )}

        {/* ── 学習点②：全体進捗バー ── */}
        <div style={{ background: C.bg3, border: `1px solid ${C.border}`, borderRadius: 12, padding: '18px 20px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>整体进度</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: allDone ? '#10b981' : C.sky }}>
              {progress}%
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 12, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 8,
              width: `${progress}%`,
              background: allDone ? '#10b981' : progress > 66 ? '#3b82f6' : progress > 33 ? '#f59e0b' : '#ef4444',
              transition: 'width 0.3s ease, background 0.3s',
            }} />
          </div>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            {checkedCount} / {TOTAL} 项已确认
            {allDone && <span style={{ color: '#10b981', fontWeight: 700 }}> ✓ 所有项目确认完毕，可以出货！</span>}
          </p>
        </div>

        {/* ── 各セクション ── */}
        {CHECKLIST.map((group, si) => {
          const sp     = sectionProgress[si];
          const secAll = checked[si].every(Boolean);
          return (
            <section key={group.id} style={{ marginBottom: 28 }}>

              {/* セクションヘッダー */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12,
                paddingBottom: 10, borderBottom: `2px solid ${group.color}44`,
              }}>
                <span style={{ fontSize: 20 }}>{group.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: group.color }}>{group.section}</span>
                {/* セクション進捗 */}
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 6, overflow: 'hidden', maxWidth: 120 }}>
                  <div style={{ height: '100%', borderRadius: 6, width: `${sp.pct}%`, background: group.color, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{sp.checked}/{sp.total}</span>
                {/* 全選択ボタン */}
                <button
                  type="button"
                  onClick={() => toggleSection(si)}
                  style={{
                    marginLeft: 'auto', fontSize: 11, color: group.color,
                    background: group.color + '1a', border: `1px solid ${group.color}44`,
                    borderRadius: 6, padding: '3px 10px', cursor: 'pointer', outline: 'none',
                  }}
                >
                  {secAll ? '全部取消' : '全部勾选'}
                </button>
              </div>

              {/* チェックリスト項目 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.items.map((item, ii) => {
                  const isChecked = checked[si][ii];
                  return (
                    <label
                      key={ii}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                        background: isChecked ? group.color + '14' : C.bg3,
                        border: `1.5px solid ${isChecked ? group.color + '66' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: 10, padding: '11px 14px',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      {/* ── 学習点①：チェックボックス ── */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(si, ii)}
                        style={{ width: 18, height: 18, accentColor: group.color, cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{
                        fontSize: 13, lineHeight: 1.5,
                        color: isChecked ? C.text : C.muted,
                        textDecoration: isChecked ? 'none' : 'none',
                      }}>
                        {isChecked && <span style={{ color: group.color, fontWeight: 700, marginRight: 6 }}>✓</span>}
                        {item}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}

        {/* ── 全完了バナー ── */}
        {allDone && (
          <div style={{
            background: '#052e1633', border: '2px solid #10b981',
            borderRadius: 14, padding: '20px 24px', textAlign: 'center', marginBottom: 24,
          }}>
            <p style={{ fontSize: 28, marginBottom: 6 }}>✅</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>
              所有确认项目完成！货物可以出货。
            </p>
            <p style={{ fontSize: 13, color: C.muted }}>AWB · 通关 · 温度管理 — All Checked</p>
          </div>
        )}

      </div>

      <footer style={{ textAlign: 'center', padding: '24px', borderTop: `1px solid ${C.border}`, fontSize: 12, color: '#334155' }}>
        OPTEC Express DX室 · Pre-Shipment Confirmation Checklist
      </footer>
    </div>
  );
}
