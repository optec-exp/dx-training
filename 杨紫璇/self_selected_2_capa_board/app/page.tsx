'use client';

import { useState, useMemo } from 'react';

type Status = '未开始' | '进行中' | '已关闭';

interface CapaItem {
  id: string;
  title: string;
  department: string;
  owner: string;
  source: string;
  dueDate: string;
  status: Status;
}

const INITIAL_DATA: CapaItem[] = [
  { id: 'CAPA-2026-001', title: '货物交接签收率提升', department: '业务部', owner: '张经理', source: 'NCR-2026-001', dueDate: '2026-04-20', status: '进行中' },
  { id: 'CAPA-2026-002', title: '新员工ISO意识培训补充', department: '总务人事部', owner: '李主任', source: 'NCR-2026-002', dueDate: '2026-04-28', status: '进行中' },
  { id: 'CAPA-2026-003', title: '系统文件版本控制整改', department: 'DX部门', owner: '王工程师', source: 'NCR-2026-003', dueDate: '2026-05-01', status: '未开始' },
  { id: 'CAPA-2026-004', title: 'Q1供应商季度评估补录', department: '财务部', owner: '陈会计', source: 'NCR-2026-004', dueDate: '2026-05-10', status: '未开始' },
  { id: 'CAPA-2026-005', title: '对外报价审批流程修订', department: '市场开发部', owner: '赵主任', source: 'NCR-2026-005', dueDate: '2026-04-15', status: '进行中' },
  { id: 'CAPA-2026-006', title: '危险品申报双重审核建立', department: '业务部', owner: '刘主管', source: 'NCR-2026-006', dueDate: '2026-05-15', status: '未开始' },
  { id: 'CAPA-2026-007', title: 'Q1管理评审报告归档', department: '管理层', owner: '总经理办公室', source: 'NCR-2026-007', dueDate: '2026-04-10', status: '已关闭' },
  { id: 'CAPA-2026-008', title: '办公设备年度保养补档', department: '总务人事部', owner: '李主任', source: 'NCR-2026-008', dueDate: '2026-03-31', status: '已关闭' },
  { id: 'CAPA-2026-009', title: '客户投诉响应自动提醒', department: '业务部', owner: '张经理', source: 'NCR-2026-009', dueDate: '2026-05-20', status: '未开始' },
  { id: 'CAPA-2026-010', title: '数据备份监控告警建立', department: 'DX部门', owner: '王工程师', source: 'NCR-2026-010', dueDate: '2026-04-26', status: '进行中' },
  { id: 'CAPA-2026-011', title: '客户满意度调查机制优化', department: '市场开发部', owner: '赵主任', source: '内审发现', dueDate: '2026-05-30', status: '未开始' },
  { id: 'CAPA-2026-012', title: '仓储温控记录电子化', department: '业务部', owner: '刘主管', source: '内审发现', dueDate: '2026-06-15', status: '未开始' },
];

const STATUS_LIST: (Status | '全部')[] = ['全部', '未开始', '进行中', '已关闭'];

const STATUS_STYLE: Record<Status, { color: string; bg: string; border: string }> = {
  未开始: { color: '#888',    bg: 'rgba(136,136,136,0.1)',  border: 'rgba(136,136,136,0.3)' },
  进行中: { color: '#f0c040', bg: 'rgba(240,192,64,0.12)',  border: 'rgba(240,192,64,0.4)' },
  已关闭: { color: '#4caf50', bg: 'rgba(76,175,80,0.12)',   border: 'rgba(76,175,80,0.4)' },
};

function getDueDateStyle(dueDate: string, status: Status): { color: string; label: string } {
  if (status === '已关闭') return { color: 'var(--gray)', label: dueDate };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0)  return { color: 'var(--red)',    label: `${dueDate}（逾期${Math.abs(diff)}天）` };
  if (diff <= 7) return { color: 'var(--orange)', label: `${dueDate}（剩${diff}天）` };
  return           { color: 'var(--green)',  label: `${dueDate}（剩${diff}天）` };
}

export default function Home() {
  const [items, setItems] = useState<CapaItem[]>(INITIAL_DATA);
  const [filterStatus, setFilterStatus] = useState<Status | '全部'>('全部');

  function cycleStatus(id: string) {
    const ORDER: Status[] = ['未开始', '进行中', '已关闭'];
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const idx = ORDER.indexOf(item.status);
        return { ...item, status: ORDER[(idx + 1) % ORDER.length] };
      })
    );
  }

  const filtered = useMemo(() =>
    filterStatus === '全部' ? items : items.filter((i) => i.status === filterStatus),
    [items, filterStatus]
  );

  const closedCount = useMemo(() => items.filter((i) => i.status === '已关闭').length, [items]);
  const closedPct = Math.round((closedCount / items.length) * 100);

  const counts = useMemo(() => {
    const c: Record<string, number> = { 全部: items.length };
    for (const s of ['未开始', '进行中', '已关闭'] as Status[]) {
      c[s] = items.filter((i) => i.status === s).length;
    }
    return c;
  }, [items]);

  // 按部门统计
  const deptStats = useMemo(() => {
    const map: Record<string, Record<Status, number>> = {};
    for (const item of items) {
      if (!map[item.department]) map[item.department] = { 未开始: 0, 进行中: 0, 已关闭: 0 };
      map[item.department][item.status]++;
    }
    return Object.entries(map).map(([dept, counts]) => ({
      dept,
      total: counts['未开始'] + counts['进行中'] + counts['已关闭'],
      ...counts,
    })).sort((a, b) => b.total - a.total);
  }, [items]);

  // 按月统计
  const monthStats = useMemo(() => {
    const map: Record<string, Record<Status, number>> = {};
    for (const item of items) {
      const month = item.dueDate.slice(0, 7); // YYYY-MM
      if (!map[month]) map[month] = { 未开始: 0, 进行中: 0, 已关闭: 0 };
      map[month][item.status]++;
    }
    return Object.entries(map).map(([month, counts]) => ({
      month,
      total: counts['未开始'] + counts['进行中'] + counts['已关闭'],
      ...counts,
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [items]);

  const maxDeptTotal = Math.max(...deptStats.map((d) => d.total), 1);
  const maxMonthTotal = Math.max(...monthStats.map((m) => m.total), 1);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {/* Header */}
      <header style={{ background: 'var(--dark2)', borderBottom: '1px solid var(--border)', padding: '24px 32px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: 3, marginBottom: 8 }}>
            OPTEC EXPRESS · QUALITY MANAGEMENT
          </div>
          <h1 style={{ fontSize: 28, color: 'var(--gold)', fontFamily: 'Georgia, serif', marginBottom: 4 }}>
            CAPA 追踪看板
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            纠正与预防措施进度管理 · Corrective & Preventive Action Tracker
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Close Rate Bar */}
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 28px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>整体关闭率</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)' }}>{closedPct}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${closedPct}%`,
                background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                borderRadius: 4,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
              {closedCount} / {items.length} 项已关闭
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {(['未开始', '进行中', '已关闭'] as Status[]).map((s) => (
              <div key={s} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: STATUS_STYLE[s].color }}>{counts[s]}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {STATUS_LIST.map((s) => {
            const active = filterStatus === s;
            const color = s === '全部' ? 'var(--gold)' : STATUS_STYLE[s].color;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: '7px 20px',
                  borderRadius: 24,
                  border: `1px solid ${active ? color : 'var(--border)'}`,
                  background: active ? (s === '全部' ? 'var(--gold)' : STATUS_STYLE[s].bg) : 'transparent',
                  color: active ? (s === '全部' ? 'var(--dark)' : color) : 'var(--text-dim)',
                  fontFamily: 'Georgia, serif',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: active ? 700 : 400,
                  transition: 'all 0.2s',
                }}
              >
                {s} {s !== '全部' && `(${counts[s]})`}
              </button>
            );
          })}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-dim)', alignSelf: 'center' }}>
            点击状态标签可切换进度
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
            <thead>
              <tr>
                {['编号', '标题', '部门', '责任人', '来源', '截止日', '状态'].map((h) => (
                  <th key={h} style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    color: 'var(--gold)',
                    fontWeight: 600,
                    textAlign: 'left',
                    letterSpacing: 1,
                    background: 'var(--dark2)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const st = STATUS_STYLE[item.status];
                const due = getDueDateStyle(item.dueDate, item.status);
                return (
                  <tr key={item.id} style={{ transition: 'opacity 0.2s' }}>
                    {/* ID */}
                    <td style={tdStyle}>
                      <span style={{
                        fontSize: 11, color: 'var(--gold)',
                        background: 'rgba(201,169,110,0.1)',
                        border: '1px solid var(--border)',
                        borderRadius: 5, padding: '2px 8px',
                        whiteSpace: 'nowrap',
                      }}>
                        {item.id}
                      </span>
                    </td>
                    {/* Title */}
                    <td style={{ ...tdStyle, maxWidth: 200 }}>
                      <span style={{
                        fontSize: 14,
                        color: item.status === '已关闭' ? 'var(--text-dim)' : 'var(--text)',
                        textDecoration: item.status === '已关闭' ? 'line-through' : 'none',
                      }}>
                        {item.title}
                      </span>
                    </td>
                    {/* Dept */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{item.department}</span>
                    </td>
                    {/* Owner */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{item.owner}</span>
                    </td>
                    {/* Source */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{item.source}</span>
                    </td>
                    {/* Due Date */}
                    <td style={tdStyle}>
                      <span style={{ fontSize: 13, color: due.color, whiteSpace: 'nowrap' }}>
                        {due.label}
                      </span>
                    </td>
                    {/* Status */}
                    <td style={tdStyle}>
                      <button
                        onClick={() => cycleStatus(item.id)}
                        title="点击切换状态"
                        style={{
                          padding: '5px 14px',
                          borderRadius: 20,
                          border: `1px solid ${st.border}`,
                          background: st.bg,
                          color: st.color,
                          fontFamily: 'Georgia, serif',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                        }}
                      >
                        {item.status}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-dim)', fontSize: 14 }}>
            此状态下暂无 CAPA 项目
          </div>
        )}

        {/* Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32 }}>

          {/* By Department */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 24px' }}>
            <h2 style={{ fontSize: 14, color: 'var(--gold)', marginBottom: 18, fontFamily: 'Georgia, serif' }}>
              按部门统计
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {deptStats.map(({ dept, total, 未开始: ns, 进行中: ip, 已关闭: cl }) => (
                <div key={dept}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{dept}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{total} 项</span>
                  </div>
                  <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    {cl > 0 && <div style={{ width: `${(cl / maxDeptTotal) * 100}%`, background: 'var(--green)', transition: 'width 0.4s' }} title={`已关闭 ${cl}`} />}
                    {ip > 0 && <div style={{ width: `${(ip / maxDeptTotal) * 100}%`, background: 'var(--orange)', transition: 'width 0.4s' }} title={`进行中 ${ip}`} />}
                    {ns > 0 && <div style={{ width: `${(ns / maxDeptTotal) * 100}%`, background: 'var(--gray)', transition: 'width 0.4s' }} title={`未开始 ${ns}`} />}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    {cl > 0 && <span style={{ fontSize: 11, color: 'var(--green)' }}>已关闭 {cl}</span>}
                    {ip > 0 && <span style={{ fontSize: 11, color: 'var(--orange)' }}>进行中 {ip}</span>}
                    {ns > 0 && <span style={{ fontSize: 11, color: 'var(--gray)' }}>未开始 {ns}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Month */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '22px 24px' }}>
            <h2 style={{ fontSize: 14, color: 'var(--gold)', marginBottom: 18, fontFamily: 'Georgia, serif' }}>
              按截止月份统计
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {monthStats.map(({ month, total, 未开始: ns, 进行中: ip, 已关闭: cl }) => (
                <div key={month}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: 'var(--text)' }}>{month}</span>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: cl === total ? 'var(--green)' : cl > 0 ? 'var(--orange)' : 'var(--gray)', fontWeight: 600 }}>
                        关闭率 {Math.round((cl / total) * 100)}%
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{total} 项</span>
                    </div>
                  </div>
                  <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    {cl > 0 && <div style={{ width: `${(cl / maxMonthTotal) * 100}%`, background: 'var(--green)', transition: 'width 0.4s' }} title={`已关闭 ${cl}`} />}
                    {ip > 0 && <div style={{ width: `${(ip / maxMonthTotal) * 100}%`, background: 'var(--orange)', transition: 'width 0.4s' }} title={`进行中 ${ip}`} />}
                    {ns > 0 && <div style={{ width: `${(ns / maxMonthTotal) * 100}%`, background: 'var(--gray)', transition: 'width 0.4s' }} title={`未开始 ${ns}`} />}
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    {cl > 0 && <span style={{ fontSize: 11, color: 'var(--green)' }}>已关闭 {cl}</span>}
                    {ip > 0 && <span style={{ fontSize: 11, color: 'var(--orange)' }}>进行中 {ip}</span>}
                    {ns > 0 && <span style={{ fontSize: 11, color: 'var(--gray)' }}>未开始 {ns}</span>}
                  </div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              {[['var(--green)', '已关闭'], ['var(--orange)', '进行中'], ['var(--gray)', '未开始']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>

      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-dim)',
        fontSize: 12,
        marginTop: 20,
      }}>
        OPTEC Express · CAPA Tracking Dashboard · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: '14px',
  background: 'var(--card)',
  borderTop: '1px solid var(--border)',
  borderBottom: '1px solid var(--border)',
  verticalAlign: 'middle',
};
