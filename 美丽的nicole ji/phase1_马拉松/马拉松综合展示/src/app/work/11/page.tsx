'use client';
import { useState, useMemo } from 'react';

const NODES = [
  { key: 'received', emoji: '📦', label: '仓库收货', desc: '货物已安全到达仓库' },
  { key: 'departed', emoji: '🏭', label: '已出库', desc: '货物已从仓库装车发出' },
  { key: 'takeoff',  emoji: '✈️', label: '起飞',   desc: '航班已按时起飞' },
  { key: 'arrived',  emoji: '🛬', label: '到达',   desc: '货物已到达目的地机场' },
  { key: 'customs',  emoji: '🛃', label: '清关',   desc: '正在办理进口通关手续' },

  { key: 'complete', emoji: '🎯', label: '完成',   desc: '货物已成功交付给收货人' },
  { key: 'lost',     emoji: '❌', label: '失败', desc: '货物已丢失' },
] as const;

type NS = 'pending' | 'current' | 'done';
type NodeKey = typeof NODES[number]['key'];

interface NodeState { status: NS; time: string; note: string; }

const NEXT: Record<NS, NS> = { pending: 'current', current: 'done', done: 'pending' };
const S_ICON:  Record<NS, string> = { pending: '⬜', current: '⏳', done: '✅' };
const S_LABEL: Record<NS, string> = { pending: '待处理', current: '进行中', done: '已完成' };
const S_COLOR: Record<NS, string> = { pending: '#1e3a5f', current: '#a47f40', done: '#14532d' };
const S_BORDER: Record<NS, string> = { pending: '#1e3a5f', current: '#f59e0b', done: '#22c55e' };

const initNodes = (): Record<NodeKey, NodeState> =>
  Object.fromEntries(NODES.map(n => [n.key, { status: 'pending', time: '', note: '' }])) as Record<NodeKey, NodeState>;

const INP: React.CSSProperties = {
  background: '#0d1b2e', border: '1px solid #1e3a5f', borderRadius: 6,
  color: '#e2e8f0', padding: '8px 12px', width: '100%', fontSize: 13,
};

export default function Page() {
  const [caseNo,    setCaseNo]    = useState('');
  const [customer,  setCustomer]  = useState('');
  const [cargo,     setCargo]     = useState('');
  const [route,     setRoute]     = useState('');
  const [flight,    setFlight]    = useState('');
  const [handler,   setHandler]   = useState('');
  const [email,     setEmail]     = useState('');
  const [eta,       setEta]       = useState('');
  const [nodes,     setNodes]     = useState<Record<NodeKey, NodeState>>(initNodes);
  const [copied,    setCopied]    = useState(false);

  const cycleNode = (key: NodeKey) => {
    setNodes(prev => ({ ...prev, [key]: { ...prev[key], status: NEXT[prev[key].status] } }));
  };

  const updateNode = (key: NodeKey, field: 'time' | 'note', val: string) => {
    setNodes(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  };

  const currentNode = useMemo(() => {
    return NODES.find(n => nodes[n.key].status === 'current');
  }, [nodes]);

  const output = useMemo(() => {
    const sep = '━━━━━━━━━━━━━━━━━━━━━━━━';
    const lines: string[] = [];
    lines.push('【OPTEC Express　货物追踪通知】');
    lines.push(sep);
    if (caseNo)   lines.push(`案件号：${caseNo}`);
    if (customer) lines.push(`客　户：${customer}`);
    if (cargo)    lines.push(`货　物：${cargo}`);
    if (route)    lines.push(`航　线：${route}`);
    if (flight)   lines.push(`航　班：${flight}`);
    if (handler)  lines.push(`负责人：${handler}${email ? `（${email}）` : ''}`);
    lines.push(sep);
    lines.push('【追踪节点】');
    NODES.forEach(n => {
      const ns = nodes[n.key];
      if (ns.status === 'pending') {
        lines.push(`${S_ICON.pending} ${n.emoji} ${n.label}`);
      } else if (ns.status === 'current') {
        const t = ns.time ? `   ${ns.time}` : '';
        const note = ns.note ? `   ← ${ns.note}` : '   ← 当前';
        lines.push(`${S_ICON.current} ${n.emoji} ${n.label}${t}${note}`);
      } else {
        const t = ns.time ? `   ${ns.time}` : '';
        const note = ns.note ? `   ${ns.note}` : '';
        lines.push(`${S_ICON.done} ${n.emoji} ${n.label}${t}${note}`);
      }
    });
    lines.push(sep);
    if (currentNode) {
      lines.push(`当前状态：${S_ICON.current} ${currentNode.label}`);
    } else {
      const allDone = NODES.every(n => nodes[n.key].status === 'done');
      lines.push(allDone ? '当前状态：✅ 全部完成' : '当前状态：待更新');
    }
    if (eta) lines.push(`预计完成：${eta}`);
    lines.push(sep);
    lines.push('感谢您选择 OPTEC Express！');
    lines.push('如有疑问请联系我们的客服团队。');
    return lines.join('\n');
  }, [caseNo, customer, cargo, route, flight, handler, email, eta, nodes, currentNode]);

  const copy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const field = (label: string, value: string, setter: (v: string) => void, placeholder = '') => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 16, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <input style={INP} value={value} placeholder={placeholder} onChange={e => setter(e.target.value)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>✈️ 货物状态查询</div>
        <div style={{ color: '#64748b', fontSize: 14 }}>编辑追踪节点 · 生成通知文本</div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* LEFT */}
        <div>
          {/* Basic Info */}
          <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 30, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, color: '#93c5fd' }}>📋 案件基本信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
              {field('案件号', caseNo, setCaseNo, 'OPT-2026-XXXX')}
              {field('客户名称', customer, setCustomer, '公司名称')}
              {field('货物名称', cargo, setCargo, '货物描述')}
              {field('航线', route, setRoute, '如：NRT-HKG')}
              {field('航班号', flight, setFlight, '如：CX543')}
              {field('负责人', handler, setHandler, '姓名')}
              {field('邮箱', email, setEmail, 'xxx@optec-exp.com')}
              {field('预计完成', eta, setEta, '如：2026-05-01')}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 16, color: '#93c5fd' }}>
              🗺️ 追踪节点
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10, fontWeight: 400 }}>点击图标切换状态</span>
            </div>
            {NODES.map((n, i) => {
              const ns = nodes[n.key];
              const active = ns.status !== 'pending';
              return (
                <div key={n.key} style={{ display: 'flex', gap: 12, marginBottom: i < NODES.length - 1 ? 10 : 0 }}>
                  {/* Step icon */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <button
                      onClick={() => cycleNode(n.key)}
                      title={`当前：${S_LABEL[ns.status]}，点击切换`}
                      style={{
                        width: 44, height: 44, borderRadius: '50%', border: `2px solid ${S_BORDER[ns.status]}`,
                        background: S_COLOR[ns.status], cursor: 'pointer', fontSize: 18,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      {ns.status === 'pending' ? n.emoji : S_ICON[ns.status]}
                    </button>
                    {i < NODES.length - 1 && (
                      <div style={{ width: 2, flex: 1, minHeight: 8, background: '#1e3a5f', margin: '2px 0' }} />
                    )}
                  </div>
                  {/* Node content */}
                  <div style={{ flex: 1, paddingTop: 4, paddingBottom: i < NODES.length - 1 ? 10 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: active ? 8 : 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{n.emoji} {n.label}</span>
                      <span style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: S_COLOR[ns.status], color: ns.status === 'pending' ? '#64748b' : ns.status === 'current' ? '#fbbf24' : '#4ade80',
                        border: `1px solid ${S_BORDER[ns.status]}`,
                      }}>{S_LABEL[ns.status]}</span>
                    </div>
                    {!active && <div style={{ fontSize: 12, color: '#475569' }}>{n.desc}</div>}
                    {active && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>时间</div>
                          <input
                            style={{ ...INP, fontSize: 12 }}
                            placeholder="2026-04-28 09:00"
                            value={ns.time}
                            onChange={e => updateNode(n.key, 'time', e.target.value)}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>备注</div>
                          <input
                            style={{ ...INP, fontSize: 12 }}
                            placeholder="可选备注"
                            value={ns.note}
                            onChange={e => updateNode(n.key, 'note', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div style={{ position: 'sticky', top: 24, alignSelf: 'start' }}>
          <div style={{ background: '#0d1b2e', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, color: '#93c5fd' }}>📨 追踪通知文本</div>
              <button
                onClick={copy}
                style={{
                  padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  background: copied ? '#14532d' : '#1e40af', color: copied ? '#4ade80' : '#93c5fd',
                  transition: 'all .2s',
                }}
              >
                {copied ? '✅ 已复制' : '📋 复制'}
              </button>
            </div>
            <pre style={{
              background: '#020810', borderRadius: 8, padding: 16,
              fontSize: 12, lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
              color: '#cbd5e1', border: '1px solid #1e3a5f', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto',
            }}>
              {output}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
