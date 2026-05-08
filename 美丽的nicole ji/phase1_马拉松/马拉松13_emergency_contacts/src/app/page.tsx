'use client';
import { useState } from 'react';

interface Contact {
  name: string;
  role: string;
  phone: string;
  email?: string;
  hours: string;
  note?: string;
}

interface Scene {
  key: string;
  icon: string;
  title: string;
  desc: string;
  color: string;
  contacts: Contact[];
}

const SCENES: Scene[] = [
  {
    key: 'tracking',
    icon: '📦',
    title: '货物追踪查询',
    desc: '想了解货物当前位置、预计到达时间',
    color: '#0ea5e9',
    contacts: [
      { name: '客服中心', role: '货物追踪专线', phone: '03-XXXX-0001', email: 'tracking@optec-exp.com', hours: '平日 9:00–18:00', note: '请提供案件号以便快速查询' },
      { name: '操作部 OS', role: '操作负责人', phone: '03-XXXX-0010', email: 'os@optec-exp.com', hours: '平日 9:00–18:00' },
    ],
  },
  {
    key: 'delay',
    icon: '⏰',
    title: '货物延误',
    desc: '货物未按预期时间到达，需要了解延误原因',
    color: '#f59e0b',
    contacts: [
      { name: '紧急客服', role: '延误处理专线', phone: '03-XXXX-0002', email: 'urgent@optec-exp.com', hours: '24小时', note: '延误超过12小时请联系此线' },
      { name: '操作部 OS', role: '操作负责人', phone: '03-XXXX-0010', hours: '平日 9:00–18:00' },
      { name: '客服中心', role: '一般咨询', phone: '03-XXXX-0001', hours: '平日 9:00–18:00' },
    ],
  },
  {
    key: 'customs',
    icon: '🔍',
    title: '通关/海关问题',
    desc: '清关手续、报关文件、进口税费等问题',
    color: '#8b5cf6',
    contacts: [
      { name: 'GC部門', role: '通关专家', phone: '03-XXXX-0020', email: 'gc@optec-exp.com', hours: '平日 9:00–18:00', note: '请准备好商业发票及装箱单' },
      { name: '紧急客服', role: '紧急通关协助', phone: '03-XXXX-0002', hours: '24小时' },
    ],
  },
  {
    key: 'damage',
    icon: '⚠️',
    title: '货物损坏/丢失',
    desc: '收到货物时发现破损，或货物无法找到',
    color: '#ef4444',
    contacts: [
      { name: '紧急客服', role: '损坏赔偿专线', phone: '03-XXXX-0002', email: 'claim@optec-exp.com', hours: '24小时', note: '请拍摄损坏照片并保留包装材料' },
      { name: '客服中心', role: '索赔受理', phone: '03-XXXX-0001', hours: '平日 9:00–18:00' },
      { name: '品质管理', role: '品质调查', phone: '03-XXXX-0030', hours: '平日 9:00–18:00' },
    ],
  },
  {
    key: 'booking',
    icon: '📋',
    title: '新订单/预约',
    desc: '新货物委托、取货预约、报价咨询',
    color: '#22c55e',
    contacts: [
      { name: '营业部', role: '报价及预约', phone: '03-XXXX-0040', email: 'sales@optec-exp.com', hours: '平日 9:00–18:00' },
      { name: '客服中心', role: '一般受理', phone: '03-XXXX-0001', hours: '平日 9:00–18:00' },
    ],
  },
  {
    key: 'invoice',
    icon: '💴',
    title: '账单/发票',
    desc: '费用确认、发票申请、付款方式',
    color: '#f472b6',
    contacts: [
      { name: '财务部', role: '账单处理', phone: '03-XXXX-0050', email: 'finance@optec-exp.com', hours: '平日 9:00–17:00' },
      { name: '客服中心', role: '发票咨询', phone: '03-XXXX-0001', hours: '平日 9:00–18:00' },
    ],
  },
  {
    key: 'urgent',
    icon: '🚨',
    title: '紧急情况',
    desc: '需要立即处理的紧急事项（节假日/深夜）',
    color: '#dc2626',
    contacts: [
      { name: '24H紧急热线', role: '全天候紧急响应', phone: '03-XXXX-9999', hours: '24小时 · 365天', note: '仅限真实紧急情况使用' },
      { name: '紧急客服', role: '紧急处理', phone: '03-XXXX-0002', email: 'urgent@optec-exp.com', hours: '24小时' },
    ],
  },
];

export default function Page() {
  const [active, setActive] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = SCENES.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.title.includes(q) || s.desc.includes(q) ||
      s.contacts.some(c => c.name.includes(q) || c.role.includes(q));
  });

  const copyPhone = async (phone: string) => {
    await navigator.clipboard.writeText(phone);
    setCopied(phone);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeScene = SCENES.find(s => s.key === active);

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>📞 紧急联系人</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>遇到问题？选择场景，快速找到对应负责人</div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <input
            style={{
              width: '100%', background: '#0d1b2e', border: '1px solid #1e3a5f',
              borderRadius: 8, color: '#e2e8f0', padding: '10px 16px', fontSize: 14,
            }}
            placeholder="🔍  搜索场景或联系人..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Emergency banner */}
        <div style={{
          background: '#450a0a', border: '1px solid #dc2626', borderRadius: 10,
          padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 20 }}>🚨</span>
          <div>
            <span style={{ color: '#f87171', fontWeight: 600, marginRight: 12 }}>24H紧急热线：</span>
            <span style={{ color: '#fca5a5', fontFamily: 'monospace', fontSize: 16, letterSpacing: 1 }}>03-XXXX-9999</span>
          </div>
          <button
            onClick={() => copyPhone('03-XXXX-9999')}
            style={{
              marginLeft: 'auto', padding: '5px 14px', borderRadius: 6, border: '1px solid #dc2626',
              background: copied === '03-XXXX-9999' ? '#14532d' : 'transparent',
              color: copied === '03-XXXX-9999' ? '#4ade80' : '#f87171',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            {copied === '03-XXXX-9999' ? '✅ 已复制' : '📋 复制'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: active ? '300px 1fr' : '1fr', gap: 16 }}>
          {/* Scene Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: active ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {filtered.map(s => (
              <button
                key={s.key}
                onClick={() => setActive(active === s.key ? null : s.key)}
                style={{
                  background: active === s.key ? '#0d1b2e' : '#0a1628',
                  border: `2px solid ${active === s.key ? s.color : '#1e3a5f'}`,
                  borderRadius: 12, padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
                  transition: 'all .2s', color: '#e2e8f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: 15, color: active === s.key ? s.color : '#e2e8f0' }}>
                    {s.title}
                  </span>
                  <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>
                    {s.contacts.length}人 {active === s.key ? '▲' : '▶'}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{s.desc}</div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div style={{ color: '#64748b', padding: 24, textAlign: 'center', fontSize: 14 }}>
                没有找到匹配的场景
              </div>
            )}
          </div>

          {/* Detail panel */}
          {activeScene && (
            <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 24, border: `1px solid ${activeScene.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 26 }}>{activeScene.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: activeScene.color }}>{activeScene.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{activeScene.desc}</div>
                </div>
              </div>
              {activeScene.contacts.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: '#020810', borderRadius: 10, padding: 16,
                    marginBottom: i < activeScene.contacts.length - 1 ? 12 : 0,
                    border: '1px solid #1e3a5f',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: activeScene.color }}>{c.role}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                      🕐 {c.hours}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => copyPhone(c.phone)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                        borderRadius: 6, border: '1px solid #1e3a5f', cursor: 'pointer',
                        background: copied === c.phone ? '#14532d' : '#0d1b2e',
                        color: copied === c.phone ? '#4ade80' : '#e2e8f0', fontSize: 13,
                        fontFamily: 'monospace', transition: 'all .2s',
                      }}
                    >
                      📞 {copied === c.phone ? '已复制！' : c.phone}
                    </button>
                    {c.email && (
                      <button
                        onClick={() => copyPhone(c.email!)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                          borderRadius: 6, border: '1px solid #1e3a5f', cursor: 'pointer',
                          background: copied === c.email ? '#14532d' : '#0d1b2e',
                          color: copied === c.email ? '#4ade80' : '#94a3b8', fontSize: 12,
                          transition: 'all .2s',
                        }}
                      >
                        ✉️ {copied === c.email ? '已复制！' : c.email}
                      </button>
                    )}
                  </div>
                  {c.note && (
                    <div style={{
                      marginTop: 10, fontSize: 12, color: '#92400e',
                      background: '#1c1004', borderRadius: 6, padding: '6px 10px',
                      border: '1px solid #92400e',
                    }}>
                      💡 {c.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 28, textAlign: 'center', color: '#475569', fontSize: 12, lineHeight: 1.8 }}>
          <div>OPTEC Express International Co., Ltd.</div>
          <div>营业时间：平日 09:00–18:00 JST　|　24H紧急热线：03-XXXX-9999</div>
        </div>
      </div>
    </div>
  );
}
