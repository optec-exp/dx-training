'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Checklist Items ───────────────────────────────────────────────────────────

const PHASES = [
  {
    label: 'PHASE 01',
    name: '锁账前准备',
    items: [
      '确认 IATA 账单出具日',
      '将 IATA 账单次一工作日确定为"缔结日"，并告知日本财务',
    ],
  },
  {
    label: 'PHASE 02',
    name: '锁账前各项工作',
    items: [
      '查询所有相关账户上月末最后一个自然日余额，下载残高证明文件',
      '更新银行残高管理 APP',
      '获取代理出具的上月费用总账单，核查单票账单是否齐全',
      '与 kintone 支付管理 APP 中对应代理应付总额核对，确认金额完全一致',
      '执行请求突合（案件管理 APP vs 请求入金管理 APP）',
      '执行支付突合（案件管理 APP vs 支付管理 APP）',
      '将上月所有"取引日、支付日"流水录入贩管费管理 APP',
      '对流水收支分类（业务 / 贩管費 / 资金移动）',
      '填写"入出金（外貨）"表格',
      '决算突合 = 0',
      '按チーム案件判断和 business scope 对各部门分类',
      '计算粗利益（売上 − 費用）并填入月度锁账利润汇总表格',
      '报告管理群',
      '在财务报告书 APP 中执行数据抓取',
      '手动录入理财收益',
    ],
  },
];

const TOTAL = PHASES.reduce((s, p) => s + p.items.length, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function keyLabel(key: string) {
  const [y, m] = key.split('-');
  return `${y} 年 ${m} 月`;
}

function nowKey() {
  const d = new Date();
  return toKey(d.getFullYear(), d.getMonth() + 1);
}

const STORAGE_KEY = 'optec_settlement_checklists';

function loadAll(): Record<string, boolean[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, boolean[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function emptyChecked(): boolean[] {
  return Array(TOTAL).fill(false);
}

// Year range for picker
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => THIS_YEAR - 2 + i); // -2 to +2
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettlementChecklist() {
  const [allData, setAllData] = useState<Record<string, boolean[]>>({});
  const [selectedKey, setSelectedKey] = useState<string>(nowKey());
  const [mounted, setMounted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(THIS_YEAR);
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const data = loadAll();
    const current = nowKey();
    if (!data[current]) {
      data[current] = emptyChecked();
      saveAll(data);
    }
    setAllData(data);
    setMounted(true);
  }, []);

  // 点击外部关闭 picker
  useEffect(() => {
    if (!showPicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const updateChecked = useCallback((key: string, next: boolean[]) => {
    setAllData(prev => {
      const updated = { ...prev, [key]: next };
      saveAll(updated);
      return updated;
    });
  }, []);

  function toggle(globalIdx: number) {
    const current = allData[selectedKey] ?? emptyChecked();
    const next = current.map((v, i) => (i === globalIdx ? !v : v));
    updateChecked(selectedKey, next);
  }

  function resetMonth() {
    if (!window.confirm(`确认重置 ${keyLabel(selectedKey)} 的所有勾选？`)) return;
    updateChecked(selectedKey, emptyChecked());
  }

  function createMonth() {
    const key = toKey(pickerYear, pickerMonth);
    if (!allData[key]) {
      updateChecked(key, emptyChecked());
    }
    setSelectedKey(key);
    setShowPicker(false);
    if (key < nowKey()) setHistoryOpen(true);
  }

  // 打开 picker 时同步当前选中月份的年月
  function openPicker() {
    const [y, m] = selectedKey.split('-').map(Number);
    setPickerYear(y);
    setPickerMonth(m);
    setShowPicker(p => !p);
  }

  const currentKey = nowKey();
  const sortedKeys = Object.keys(allData).sort((a, b) => b.localeCompare(a));
  const futureKeys = sortedKeys.filter(k => k > currentKey);
  const historyKeys = sortedKeys.filter(k => k < currentKey);

  const checked = allData[selectedKey] ?? emptyChecked();
  const done = checked.filter(Boolean).length;
  const percent = Math.round((done / TOTAL) * 100);
  const allDone = done === TOTAL;

  const currentChecked = allData[currentKey] ?? emptyChecked();
  const currentDone = currentChecked.filter(Boolean).length;
  const currentPct = Math.round((currentDone / TOTAL) * 100);

  if (!mounted) return <div style={{ minHeight: '100vh', background: '#f7f8fa' }} />;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f8fa', fontFamily: "'Noto Sans SC', 'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* TOP BAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eaedf2', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, color: '#b8933a', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>OPTEC EXPRESS · Finance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>月度锁账检查清单</div>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>共 {TOTAL} 项 · {sortedKeys.length} 个月份</div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', maxWidth: 1000, margin: '0 auto', width: '100%', padding: '28px 24px', gap: 24, alignItems: 'flex-start' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* New month button — TOP */}
          <div style={{ position: 'relative' }} ref={pickerRef}>
            <button
              onClick={openPicker}
              style={{ width: '100%', padding: '9px 12px', background: '#fff', border: '1.5px dashed #d1d5db', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              新建月份清单
            </button>

            {showPicker && (
              <div style={{ position: 'absolute', top: '110%', left: 0, width: 200, background: '#fff', border: '1px solid #eaedf2', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 16, zIndex: 100 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 12 }}>选择月份</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>年份</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {YEARS.map(y => (
                      <button key={y} onClick={() => setPickerYear(y)}
                        style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12, border: '1px solid', cursor: 'pointer', background: pickerYear === y ? '#1a1a2e' : '#fff', color: pickerYear === y ? '#fff' : '#374151', borderColor: pickerYear === y ? '#1a1a2e' : '#e5e7eb' }}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>月份</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                    {MONTHS.map(m => (
                      <button key={m} onClick={() => setPickerMonth(m)}
                        style={{ padding: '5px 4px', borderRadius: 4, fontSize: 12, border: '1px solid', cursor: 'pointer', background: pickerMonth === m ? '#1a1a2e' : '#fff', color: pickerMonth === m ? '#fff' : '#374151', borderColor: pickerMonth === m ? '#1a1a2e' : '#e5e7eb' }}>
                        {m}月
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={createMonth}
                  style={{ width: '100%', padding: '8px', background: '#b8933a', border: 'none', borderRadius: 6, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {allData[toKey(pickerYear, pickerMonth)] ? '跳转到该月' : '创建清单'}
                </button>
              </div>
            )}
          </div>

          {/* Current month card */}
          <MonthCard
            label={keyLabel(currentKey)}
            badge="本月"
            done={currentDone}
            total={TOTAL}
            pct={currentPct}
            selected={selectedKey === currentKey}
            dark={selectedKey === currentKey}
            onClick={() => setSelectedKey(currentKey)}
          />

          {/* History section */}
          {historyKeys.length > 0 && (
            <div>
              <button
                onClick={() => setHistoryOpen(o => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}
              >
                <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>历史记录 ({historyKeys.length})</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ transform: historyOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {historyOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {historyKeys.map(key => {
                    const c = allData[key] ?? emptyChecked();
                    const d = c.filter(Boolean).length;
                    const pct = Math.round((d / TOTAL) * 100);
                    return (
                      <MonthCard
                        key={key}
                        label={keyLabel(key)}
                        done={d}
                        total={TOTAL}
                        pct={pct}
                        selected={selectedKey === key}
                        dark={false}
                        onClick={() => setSelectedKey(key)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Future months */}
          {futureKeys.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', padding: '8px 4px' }}>未来月份 ({futureKeys.length})</div>
              {futureKeys.map(key => {
                const c = allData[key] ?? emptyChecked();
                const d = c.filter(Boolean).length;
                const pct = Math.round((d / TOTAL) * 100);
                return (
                  <MonthCard key={key} label={keyLabel(key)} done={d} total={TOTAL} pct={pct}
                    selected={selectedKey === key} dark={false} onClick={() => setSelectedKey(key)} />
                );
              })}
            </div>
          )}

        </div>

        {/* ── MAIN ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Month header card */}
          <div style={{ background: '#fff', border: '1px solid #eaedf2', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                  {selectedKey === currentKey ? '当前月份' : selectedKey > currentKey ? '未来月份' : '历史记录'}
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>{keyLabel(selectedKey)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: allDone ? '#16a34a' : '#b8933a', lineHeight: 1 }}>{percent}%</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{done} / {TOTAL} 完成</div>
                </div>
                <button onClick={resetMonth}
                  style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: '1px solid #e5e7eb', borderRadius: 4, padding: '5px 12px', cursor: 'pointer' }}>
                  重置
                </button>
              </div>
            </div>
            <div style={{ height: 5, background: '#f0f1f4', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${percent}%`, background: allDone ? '#16a34a' : 'linear-gradient(90deg, #c9a84c, #b8933a)', borderRadius: 3, transition: 'width 0.35s ease' }} />
            </div>
            {allDone && (
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, color: '#15803d', fontSize: 13, fontWeight: 600 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                本月全部工作已完成，可执行系统锁账操作。
              </div>
            )}
          </div>

          {/* Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(() => {
              let globalIdx = 0;
              return PHASES.map((phase, pi) => (
                <div key={pi}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingLeft: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#374151', padding: '3px 8px', borderRadius: 3, letterSpacing: 1.5 }}>{phase.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{phase.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {phase.items.map((text, ii) => {
                      const idx = globalIdx++;
                      const isChecked = checked[idx];
                      return (
                        <div key={ii} onClick={() => toggle(idx)}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 14px', borderRadius: 7, background: isChecked ? '#f9fafb' : '#fff', border: `1px solid ${isChecked ? '#e5e7eb' : '#eaedf2'}`, cursor: 'pointer', transition: 'background 0.15s' }}>
                          <span style={{ fontSize: 11, color: '#d1d5db', flexShrink: 0, marginTop: 3, minWidth: 16, textAlign: 'right' }}>{idx + 1}</span>
                          <div style={{ width: 18, height: 18, border: `1.5px solid ${isChecked ? '#16a34a' : '#d1d5db'}`, borderRadius: 4, flexShrink: 0, marginTop: 1, background: isChecked ? '#dcfce7' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            {isChecked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="2,6 5,9 10,3" /></svg>}
                          </div>
                          <span style={{ fontSize: 13, color: isChecked ? '#9ca3af' : '#1a1a2e', lineHeight: 1.65, flex: 1, textDecoration: isChecked ? 'line-through' : 'none', textDecorationColor: '#d1d5db', userSelect: 'none', transition: 'color 0.15s' }}>
                            {text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ));
            })()}
          </div>

          {/* Warning */}
          <div style={{ marginTop: 16, padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b8933a" strokeWidth="2" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.7 }}>
              任何环节发现差异，须立即暂停并查明原因，不得在问题未解决情况下强行锁账。
            </span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #eaedf2', padding: '14px 32px', background: '#fff', textAlign: 'center' }}>
        <span style={{ fontSize: 11, color: '#d1d5db' }}>© 2026 OPTEC EXPRESS 财务室</span>
      </div>
    </div>
  );
}

// ── MonthCard ─────────────────────────────────────────────────────────────────

function MonthCard({ label, badge, done, total, pct, selected, dark, onClick }: {
  label: string; badge?: string; done: number; total: number; pct: number; selected: boolean; dark: boolean; onClick: () => void;
}) {
  const complete = done === total;
  return (
    <div onClick={onClick} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: selected && dark ? '#1a1a2e' : selected ? '#f0f4ff' : '#fff', border: `1px solid ${selected && dark ? '#1a1a2e' : selected ? '#c7d2fe' : '#eaedf2'}`, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: selected && dark ? '#fff' : '#1a1a2e' }}>{label}</span>
        {badge && <span style={{ fontSize: 9, fontWeight: 700, color: selected && dark ? '#c9a84c' : '#b8933a', letterSpacing: 1 }}>{badge}</span>}
      </div>
      <div style={{ height: 3, background: selected && dark ? '#374151' : '#eaedf2', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: complete ? '#16a34a' : selected && dark ? '#c9a84c' : '#b8933a', borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: selected && dark ? '#9ca3af' : '#6b7280' }}>{done}/{total} 完成</span>
    </div>
  );
}
