'use client';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';

// ── 时区转换组件 ──────────────────────────────────────────────────
interface City { name: string; en: string; flag: string; tz: string; std: number; }
const CITIES: City[] = [
  { name: '東京',    en: 'Tokyo',       flag: '🇯🇵', tz: 'Asia/Tokyo',          std: 9  },
  { name: '上海',    en: 'Shanghai',    flag: '🇨🇳', tz: 'Asia/Shanghai',       std: 8  },
  { name: '法兰克福', en: 'Frankfurt',   flag: '🇩🇪', tz: 'Europe/Berlin',       std: 1  },
  { name: '芝加哥',  en: 'Chicago',     flag: '🇺🇸', tz: 'America/Chicago',     std: -6 },
  { name: '墨西哥城',en: 'Mexico City', flag: '🇲🇽', tz: 'America/Mexico_City', std: -6 },
];
const p2 = (n: number) => String(n).padStart(2, '0');
function getOffset(tz: string, d: Date): number {
  const parts = new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(d);
  const s = parts.find(p => p.type === 'timeZoneName')?.value ?? '';
  const m = s.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  return (m[1] === '+' ? 1 : -1) * (parseInt(m[2]) + parseInt(m[3] ?? '0') / 60);
}
function parseInTZ(dtStr: string, tz: string): Date {
  const [datePart, timePart] = dtStr.split('T');
  const [y, mo, d] = datePart.split('-').map(Number);
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number);
  const approx = new Date(Date.UTC(y, mo - 1, d, h - getOffset(tz, new Date()), mi));
  return new Date(Date.UTC(y, mo - 1, d, h - getOffset(tz, approx), mi));
}
function fmtTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
}
function fmtDate(d: Date, tz: string) {
  return new Intl.DateTimeFormat('zh-CN', { timeZone: tz, month: 'long', day: 'numeric', weekday: 'short' }).format(d);
}
function diffLabel(h: number) {
  const hh = Math.floor(h); const mm = Math.round((h - hh) * 60);
  return mm ? `${hh}h${mm}m` : `${hh}h`;
}
function nowStr() {
  const n = new Date();
  return `${n.getFullYear()}-${p2(n.getMonth()+1)}-${p2(n.getDate())}T${p2(n.getHours())}:${p2(n.getMinutes())}`;
}
function AnalogClock({ date, tz, color }: { date: Date; tz: string; color: string }) {
  const local = new Intl.DateTimeFormat('en', {
    timeZone: tz, hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(date);
  const h = parseInt(local.find(p => p.type === 'hour')?.value ?? '0');
  const m = parseInt(local.find(p => p.type === 'minute')?.value ?? '0');
  const s = parseInt(local.find(p => p.type === 'second')?.value ?? '0');
  const secDeg  = s * 6;
  const minDeg  = m * 6 + s * 0.1;
  const hourDeg = (h % 12) * 30 + m * 0.5;
  const cx = 60; const cy = 60; const r = 54;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120" suppressHydrationWarning>
      {/* Face */}
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={color + '33'} strokeWidth={2} />
      {/* Hour marks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const x1 = cx + Math.cos(a) * 46; const y1 = cy + Math.sin(a) * 46;
        const x2 = cx + Math.cos(a) * 52; const y2 = cy + Math.sin(a) * 52;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color + '66'} strokeWidth={2} strokeLinecap="round" suppressHydrationWarning />;
      })}
      {/* Hour hand */}
      <line suppressHydrationWarning x1={cx} y1={cy} x2={cx + Math.cos((hourDeg - 90) * Math.PI / 180) * 30} y2={cy + Math.sin((hourDeg - 90) * Math.PI / 180) * 30} stroke={color} strokeWidth={4} strokeLinecap="round" />
      {/* Minute hand */}
      <line suppressHydrationWarning x1={cx} y1={cy} x2={cx + Math.cos((minDeg - 90) * Math.PI / 180) * 42} y2={cy + Math.sin((minDeg - 90) * Math.PI / 180) * 42} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      {/* Second hand */}
      <line suppressHydrationWarning x1={cx} y1={cy} x2={cx + Math.cos((secDeg - 90) * Math.PI / 180) * 46} y2={cy + Math.sin((secDeg - 90) * Math.PI / 180) * 46} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill={color} />
    </svg>
  );
}

function TimezoneWidget() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const ref = useMemo(() => new Date(tick >= 0 ? Date.now() : 0), [tick]);

  const tokyo = useMemo(() => {
    const off = getOffset(CITIES[0].tz, ref);
    return { ...CITIES[0], off, time: fmtTime(ref, CITIES[0].tz), date: fmtDate(ref, CITIES[0].tz) };
  }, [ref]);

  const others = useMemo(() => CITIES.slice(1).map(c => {
    const off = getOffset(c.tz, ref);
    const baseOff = getOffset(CITIES[0].tz, ref);
    return { ...c, off, time: fmtTime(ref, c.tz), date: fmtDate(ref, c.tz), diff: off - baseOff };
  }), [ref]);

  const COLORS = ['#0891b2', '#7c3aed', '#059669', '#d97706'];

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '20px 24px', marginBottom: 36, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>🌏 实时时区对照（以东京为基准）</div>

      {/* One row: Tokyo big + 4 others */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>

        {/* Tokyo — big clock */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#eff6ff', borderRadius: 16, padding: '16px 20px', minWidth: 140, border: '1.5px solid #2563eb33' }}>
          <AnalogClock date={ref} tz={tokyo.tz} color="#2563eb" />
          <div style={{ textAlign: 'center' }}>
            <div suppressHydrationWarning style={{ fontSize: 20, fontWeight: 800, color: '#1e40af', letterSpacing: 1 }}>{tokyo.time}</div>
            <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>{tokyo.flag} {tokyo.name}</div>
            <div suppressHydrationWarning style={{ fontSize: 10, color: '#94a3b8' }}>{tokyo.date}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', marginTop: 4 }}>📍 基准</div>
          </div>
        </div>

        {/* Other 4 cities */}
        {others.map((c, i) => (
          <div key={c.tz} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f8fafc', borderRadius: 16, padding: '16px 12px', border: '1px solid #f1f5f9' }}>
            <AnalogClock date={ref} tz={c.tz} color={COLORS[i]} />
            <div style={{ textAlign: 'center' }}>
              <div suppressHydrationWarning style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: 0.5 }}>{c.time}</div>
              <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{c.flag} {c.name}</div>
              <div suppressHydrationWarning style={{ fontSize: 10, color: '#94a3b8' }}>{c.date}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: c.diff > 0 ? '#059669' : '#dc2626' }}>
                {c.diff > 0 ? `▲ +${diffLabel(Math.abs(c.diff))}` : `▼ -${diffLabel(Math.abs(c.diff))}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const C = '#1e3a5f';   // 统一颜色

const FLOW = [
  {
    step: 1, icon: '💬', title: '询价报价',
    desc: '客户来询，给出运费报价，确认货物信息',
    tools: [
      { id: '03', emoji: '📦', name: '运费估算', hint: '快速计算空运/OBC报价' },
      { id: '01', emoji: '📧', name: '邮件模板', hint: '发报价回复邮件' },
    ],
  },
  {
    step: 2, icon: '✅', title: '接单确认',
    desc: '客户确认订单，创建案件，发送确认邮件',
    tools: [
      { id: '01', emoji: '📧', name: '邮件模板', hint: '发感谢确认邮件' },
      { id: '15', emoji: '📊', name: '案件报告', hint: '生成案件记录文档' },
      { id: '05', emoji: '📋', name: '会议议程', hint: '安排接单协调会议' },
    ],
  },
  {
    step: 3, icon: '🏭', title: '仓库收货',
    desc: '货物到达仓库，核对信息，确认包装与重量',
    tools: [
      { id: '11', emoji: '✈️', name: '货物追踪', hint: '标记「仓库收货」节点' },
      { id: '18', emoji: '⚠️', name: '危险品练习', hint: '确认货物是否为危险品' },
      { id: '17', emoji: '🛃', name: '海关申报', hint: '准备出口申报材料' },
    ],
  },
  {
    step: 4, icon: '⏰', title: '安排航班',
    desc: '预订舱位，把握截货时间，准备出库装机',
    tools: [
      { id: '04', emoji: '⏰', name: '截货倒计时', hint: '实时监控截货时间' },
      { id: '11', emoji: '✈️', name: '货物追踪', hint: '标记「已出库」节点' },
      { id: '07', emoji: '📞', name: '联系人目录', hint: '联系航空公司或代理' },
    ],
  },
  {
    step: 5, icon: '🛫', title: '起飞出发',
    desc: '航班起飞，通知客户货物已发出，更新追踪状态',
    tools: [
      { id: '11', emoji: '✈️', name: '货物追踪', hint: '标记「起飞」节点，生成通知文本' },
      { id: '01', emoji: '📧', name: '邮件模板', hint: '发送货物已起飞通知邮件' },
    ],
  },
  {
    step: 6, icon: '🛬', title: '到达清关',
    desc: '货物抵达目的地机场，办理进口通关手续',
    tools: [
      { id: '11', emoji: '✈️', name: '货物追踪', hint: '标记「到达」「清关」节点' },
      { id: '17', emoji: '🛃', name: '海关申报', hint: '查阅清关申报要求' },
      { id: '13', emoji: '🚨', name: '紧急联系人', hint: '清关遇问题快速联系负责人' },
    ],
  },
  {
    step: 7, icon: '🎯', title: '交付完成',
    desc: '货物成功交付客户，发送完成通知，收集反馈',
    tools: [
      { id: '11', emoji: '✈️', name: '货物追踪', hint: '标记「完成」节点' },
      { id: '01', emoji: '📧', name: '邮件模板', hint: '发感谢/完成确认邮件' },
      { id: '12', emoji: '⭐', name: '满意度评价', hint: '收集客户服务评价' },
      { id: '15', emoji: '📊', name: '案件报告', hint: '生成本次案件结案报告' },
    ],
  },
];

const ALWAYS = [
  { id: '13', emoji: '🚨', name: '紧急联系人', hint: '突发情况快速找到负责人' },
  { id: '09', emoji: '❓', name: '社内FAQ', hint: '遇到操作问题随时查阅' },
  { id: '14', emoji: '🔧', name: '故障诊断', hint: '服务问题逐步引导排查' },
  { id: '19', emoji: '💬', name: '业务用语', hint: '中日英业务用语随时查' },
  { id: '10', emoji: '📝', name: '会议记录', hint: '重要会议及时记录' },
];

const TRAINING = [
  { id: '06', emoji: '🗺️', name: '入职引导', hint: '新人7步入职流程' },
  { id: '08', emoji: '💺', name: '座位图', hint: '办公室座位安排管理' },
  { id: '16', emoji: '✈️', name: '航空知识测验', hint: '练习航空业务知识' },
  { id: '18', emoji: '⚠️', name: '危险品练习', hint: 'IATA分类识别练习' },
  { id: '20', emoji: '📰', name: '新闻阅读器', hint: '关注物流行业动态' },
];

function ToolChip({ tool, color }: { tool: typeof FLOW[0]['tools'][0]; color: string }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={`/work/${tool.id}`} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={tool.hint}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: hover ? color : '#fff',
          border: `1.5px solid ${color}`,
          borderRadius: 30,
          padding: '7px 16px',
          cursor: 'pointer',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 15 }}>{tool.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: hover ? '#fff' : color }}>{tool.name}</span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, "Segoe UI", sans-serif' }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2545 100%)',
        padding: '44px 32px 36px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: '#93c5fd', textTransform: 'uppercase', marginBottom: 12 }}>
          OPTEC Express · DX室 · 60天AI编程训练营
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, marginBottom: 8 }}>
          🏃‍♀️ 马拉松综合展示
        </h1>
        <p style={{ fontSize: 13, color: '#93c5fd' }}>Nicole Ji · 作品 01—20 · 按货物运输流程排列 · 点击直接进入作品</p>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 60px' }}>

        {/* Flow title */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
            货物运输全流程
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>从询价到交付，点击每个步骤中的作品直接进入使用</div>
        </div>

        {/* 时区转换 — 常驻展示 */}
        <TimezoneWidget />

        {/* Steps */}
        {FLOW.map((node, idx) => (
          <div key={node.step} style={{ display: 'flex', gap: 0, marginBottom: 0 }}>

            {/* Left: step line + label */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 100, flexShrink: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: C, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>STEP {node.step}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, whiteSpace: 'nowrap' }}>{node.title}</div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: C, color: '#fff', fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 4px #e8eef8, 0 2px 10px ${C}30`,
                  flexShrink: 0, zIndex: 1,
                }}>{node.icon}</div>
              </div>
              {idx < FLOW.length - 1 && (
                <div style={{ width: 2, flex: 1, minHeight: 24, background: '#dde3ec', margin: '6px 0' }} />
              )}
            </div>

            {/* Right: content */}
            <div style={{ flex: 1, paddingLeft: 28, paddingBottom: idx < FLOW.length - 1 ? 36 : 0 }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.7, paddingTop: 12 }}>{node.desc}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {node.tools.map(tool => (
                  <ToolChip key={tool.id + node.step} tool={tool} color={C} />
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Bottom panels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 48 }}>

          {/* Panel: 随时可用 */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 18 }}>📌</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>随时可用的工具</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>全程任何阶段都可能用到</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALWAYS.map(tool => <ToolChip key={tool.id} tool={tool} color="#475569" />)}
            </div>
          </div>

          {/* Panel: 培训管理 */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 18 }}>🎓</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>培训与内部管理</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>日常运营与员工成长</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRAINING.map(tool => <ToolChip key={tool.id} tool={tool} color="#475569" />)}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1e3a5f', color: '#475569', padding: '18px', textAlign: 'center', fontSize: 12 }}>
        Nicole Ji · OPTEC Express DX室 · 2026
      </div>
    </div>
  );
}
