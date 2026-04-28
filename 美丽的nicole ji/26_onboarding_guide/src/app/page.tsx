'use client';
import { useState, useMemo } from 'react';

// ─── 数据定义 ────────────────────────────────────────────────

interface CheckItem { id: number; label: string; note?: string; }
interface Step { id: number; title: string; icon: string; owner: string; color: string; items: CheckItem[]; }

const STEPS: Step[] = [
  {
    id: 1, title: '入职培训', icon: '🎓', owner: '人事 负责', color: '#0ea5e9',
    items: [
      { id: 101, label: '参加入职说明会',       note: '人事主导，约 2 小时' },
      { id: 102, label: '劳务合同签署确认' },
      { id: 103, label: '公司规章制度说明' },
      { id: 104, label: '系统账号注册（邮箱・OA）', note: 'DX 室协助' },
      { id: 105, label: '公司福利制度说明' },
    ],
  },
  {
    id: 2, title: '办公用品分发', icon: '📦', owner: '总务 负责', color: '#f59e0b',
    items: [
      { id: 201, label: '员工证 / ID 卡领取' },
      { id: 202, label: '办公设备（PC / 手机）领取' },
      { id: 203, label: '文具套装领取' },
      { id: 204, label: '部门相关资料接收' },
    ],
  },
  {
    id: 3, title: '下派到部门', icon: '🏢', owner: '部门 负责', color: '#10b981',
    items: [
      { id: 301, label: '与部门负责人面谈' },
      { id: 302, label: '座位安排 & 工位配置' },
      { id: 303, label: '部门同事介绍' },
      { id: 304, label: 'OJT 正式开始' },
      { id: 305, label: '第一周任务确认' },
    ],
  },
];

const TOTAL = STEPS.reduce((s, st) => s + st.items.length, 0);

interface SubDept { name: string; tags?: string[]; }
interface Dept    { name: string; head: string; color: string; subs: SubDept[]; }
const ORG: Dept[] = [
  {
    name: '業務部', head: 'LUNA', color: '#0ea5e9',
    subs: [
      { name: 'OS 部門', tags: ['報価', '操作', '海外開発'] },
      { name: 'GC 部門' },
    ],
  },
  {
    name: '非業務部', head: 'JENNY', color: '#a78bfa',
    subs: [
      { name: '総務' }, { name: '人事' }, { name: '品宣' }, { name: '財務' }, { name: 'DX 室' },
    ],
  },
];

const CONTACTS = [
  { name: 'LUNA',   role: '業務部部長',  color: '#0ea5e9', icon: '👔', note: '業務相关・OS/GC部門' },
  { name: 'JENNY',  role: '非業務部部長', color: '#a78bfa', icon: '👔', note: '人事・総務・DX等' },
  { name: '人事担当', role: '入职手续',   color: '#10b981', icon: '📋', note: '合同・账号・福利' },
  { name: '総務担当', role: '办公用品',   color: '#f59e0b', icon: '📦', note: '设备・文具・证件' },
];

const TIPS = [
  { icon: '📧', text: '邮件第一封请抄送直属上司' },
  { icon: '🗓️', text: '每日参加 Daily Share（デイリーシェア）' },
  { icon: '🔐', text: '系统账号密码请勿与他人共享' },
  { icon: '📱', text: '工作群组已添加，请保持消息畅通' },
  { icon: '🤝', text: '有疑问先找部门前辈，放心提问！' },
];

// ─── 主组件 ─────────────────────────────────────────────────

export default function Page() {
  // Set<number> 存储已勾选项目 ID
  const [checked,  setChecked]  = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number[]>([1]);

  const toggle = (id: number) =>
    setChecked(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const toggleStep = (id: number) =>
    setExpanded(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const progress = useMemo(() => Math.round(checked.size / TOTAL * 100), [checked]);

  // 自动判断当前所在步骤（第一个未完成的步骤）
  const currentStep = useMemo(() => {
    for (const step of STEPS) {
      if (!step.items.every(item => checked.has(item.id))) return step.id;
    }
    return STEPS.length + 1; // 全完成
  }, [checked]);

  const SEC: React.CSSProperties = {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '14px', padding: '20px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#030b18', color: '#e2e8f0', fontFamily: 'system-ui,"Segoe UI",sans-serif', padding: '24px' }}>

      {/* ── Header ── */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '13px', color: '#475569', letterSpacing: '0.1em', marginBottom: '6px' }}>
          OPTEC Express
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', margin: 0 }}>
          🌟 新人入职指南
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
          ようこそ！入职后はこのガイドに沿って進めてください · Welcome aboard!
        </p>
      </div>

      {/* ── 整体进度条 ── */}
      <div style={{ ...SEC, marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
            {currentStep > STEPS.length ? '🎉 入职流程全部完成！' : `当前进行中：第 ${currentStep} 步`}
          </span>
          <span style={{ fontSize: '20px', fontWeight: 800, color: progress === 100 ? '#10b981' : '#38bdf8' }}>
            {progress}%
          </span>
        </div>
        <div style={{ height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '5px',
            width: `${progress}%`,
            background: progress === 100 ? '#10b981' : 'linear-gradient(90deg,#0ea5e9,#38bdf8)',
            transition: 'width 0.4s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {STEPS.map(s => {
            const done = s.items.every(i => checked.has(i.id));
            const active = s.id === currentStep;
            return (
              <span key={s.id} style={{ fontSize: '11px', color: done ? '#10b981' : active ? '#38bdf8' : '#334155', fontWeight: done || active ? 700 : 400 }}>
                {done ? '✅' : active ? '▶' : '○'} {s.title}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* ════ LEFT: 入职流程 ════ */}
        <div style={{ width: '48%', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '4px' }}>
            📋 入职流程
          </h2>

          {STEPS.map(step => {
            const stepDone = step.items.every(i => checked.has(i.id));
            const stepCount = step.items.filter(i => checked.has(i.id)).length;
            const isOpen = expanded.includes(step.id);
            const isCurrent = step.id === currentStep;

            return (
              <div key={step.id} style={{
                background: '#0f172a',
                border: `1px solid ${stepDone ? '#10b98144' : isCurrent ? step.color + '55' : '#1e293b'}`,
                borderRadius: '12px', overflow: 'hidden',
              }}>
                {/* Step header */}
                <div
                  onClick={() => toggleStep(step.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px 16px', cursor: 'pointer',
                    background: isCurrent ? step.color + '11' : 'transparent',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: stepDone ? '#10b981' : isCurrent ? step.color : '#1e293b',
                    border: `2px solid ${stepDone ? '#10b981' : step.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', flexShrink: 0,
                  }}>
                    {stepDone ? '✓' : step.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: stepDone ? '#10b981' : isCurrent ? '#f1f5f9' : '#94a3b8' }}>
                      Step {step.id}　{step.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      {step.owner} · {stepCount}/{step.items.length} 完了
                    </div>
                  </div>
                  <span style={{ color: '#475569', fontSize: '14px' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Step items */}
                {isOpen && (
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid #1e293b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingTop: '10px' }}>
                      {step.items.map(item => {
                        const done = checked.has(item.id);
                        return (
                          <label key={item.id} style={{
                            display: 'flex', alignItems: 'flex-start', gap: '10px',
                            padding: '7px 10px', borderRadius: '8px', cursor: 'pointer',
                            background: done ? '#05291622' : 'transparent',
                          }}>
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => toggle(item.id)}
                              style={{ marginTop: '2px', accentColor: step.color, width: '15px', height: '15px', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <div>
                              <span style={{ fontSize: '13px', color: done ? '#475569' : '#e2e8f0', textDecoration: done ? 'line-through' : 'none' }}>
                                {item.label}
                              </span>
                              {item.note && (
                                <div style={{ fontSize: '11px', color: '#475569', marginTop: '1px' }}>{item.note}</div>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Tips */}
          <div style={{ ...SEC, marginTop: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginBottom: '10px' }}>
              💡 新人须知
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {TIPS.map((tip, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#94a3b8' }}>
                  <span style={{ fontSize: '16px' }}>{tip.icon}</span>
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT: 架构 + 联系 ════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Org chart */}
          <div style={SEC}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '16px' }}>
              🏢 公司架构
            </h2>

            {/* Root */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{
                padding: '8px 24px', borderRadius: '8px',
                background: '#1e293b', border: '2px solid #38bdf8',
                fontSize: '14px', fontWeight: 800, color: '#38bdf8',
              }}>
                OPTEC Express
              </div>
            </div>

            {/* Branch line */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <div style={{ width: '2px', height: '16px', background: '#334155' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <div style={{ width: '50%', height: '2px', background: '#334155' }} />
            </div>

            {/* Two departments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {ORG.map(dept => (
                <div key={dept.name}>
                  {/* Dept header */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                    <div style={{
                      padding: '8px 16px', borderRadius: '8px', textAlign: 'center',
                      background: dept.color + '22', border: `1px solid ${dept.color}55`,
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: dept.color }}>{dept.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>部長: {dept.head}</div>
                    </div>
                  </div>
                  {/* Sub-depts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dept.subs.map(sub => (
                      <div key={sub.name} style={{
                        background: '#1e293b', borderRadius: '8px', padding: '8px 12px',
                        border: `1px solid #334155`,
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>{sub.name}</div>
                        {sub.tags && sub.tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px' }}>
                            {sub.tags.map(tag => (
                              <span key={tag} style={{
                                fontSize: '10px', color: dept.color, background: dept.color + '22',
                                border: `1px solid ${dept.color}44`, padding: '1px 6px', borderRadius: '3px',
                              }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contacts */}
          <div style={SEC}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '14px' }}>
              📞 快速联系
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {CONTACTS.map(c => (
                <div key={c.name} style={{
                  background: c.color + '11', border: `1px solid ${c.color}44`,
                  borderRadius: '10px', padding: '14px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '20px' }}>{c.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: c.color }}>{c.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{c.role}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: `1px solid ${c.color}22`, paddingTop: '6px' }}>
                    {c.note}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
