'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

// ── 颜色 ──────────────────────────────────────────────────
const C = {
  bg:      '#f0f4f8',
  white:   '#ffffff',
  primary: '#0050b3',
  accent:  '#1677ff',
  text:    '#1a1a2e',
  sub:     '#5a6a7a',
  border:  '#d0dae6',
  green:   '#52c41a',
  orange:  '#fa8c16',
  red:     '#f5222d',
  purple:  '#722ed1',
};

// 饼图颜色
const PIE_COLORS = ['#1677ff','#52c41a','#fa8c16','#f5222d','#722ed1','#13c2c2','#eb2f96'];

// ── 型定义 ────────────────────────────────────────────────
interface RawRecord {
  $id:            { value: string };
  顧客名:         { value: string };
  操作ステータス: { value: string };
  Mode:           { value: string };
  ETD:            { value: string };
  ETA:            { value: string };
  AWB_NO:         { value: string };
}

// ── 期间プリセット ─────────────────────────────────────────
function getPreset(key: string): { from: string; to: string } {
  const today = new Date();
  const fmt   = (d: Date) => d.toISOString().slice(0, 10);

  if (key === '1m') {
    // 当月 1 日 ～ 月末
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: fmt(from), to: fmt(to) };
  }
  if (key === '3m') {
    const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    return { from: fmt(from), to: fmt(today) };
  }
  if (key === '6m') {
    const from = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    return { from: fmt(from), to: fmt(today) };
  }
  if (key === '12m') {
    const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    return { from: fmt(from), to: fmt(today) };
  }
  // 'all' → 空条件（全部）
  return { from: '', to: '' };
}

// ── KPI カード ─────────────────────────────────────────────
function KpiCard({ label, value, unit, color }: {
  label: string; value: string | number; unit?: string; color: string;
}) {
  return (
    <div style={{
      background: C.white, borderRadius: 10,
      padding: '16px 20px', flex: '1 1 160px',
      boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>
        {value}
        {unit && <span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>{unit}</span>}
      </div>
    </div>
  );
}

// ── メイン ─────────────────────────────────────────────────
export default function Home() {
  // 期間選択（デフォルト: 当月）
  const [preset,   setPreset]   = useState('1m');
  const [dateFrom, setDateFrom] = useState(() => getPreset('1m').from);
  const [dateTo,   setDateTo]   = useState(() => getPreset('1m').to);

  const [records, setRecords] = useState<RawRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── 期間プリセット変更 ──────────────────────────────────
  const applyPreset = (key: string) => {
    setPreset(key);
    const { from, to } = getPreset(key);
    setDateFrom(from);
    setDateTo(to);
  };

  // ── データ取得 ─────────────────────────────────────────
  const loadData = async (from: string, to: string) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (from) params.set('dateFrom', from);
    if (to)   params.set('dateTo',   to);

    try {
      const res  = await fetch(`/api/kpi?${params}`);
      const json = await res.json();
      if (json.error) { setError(json.error); setRecords([]); }
      else setRecords(json.records ?? []);
    } catch {
      setError('网络请求失败');
    }
    setLoading(false);
  };

  useEffect(() => { loadData(dateFrom, dateTo); }, [dateFrom, dateTo]);

  // ── 数据汇总（useMemo：只有 records 变化时才重算） ──────
  const kpi = useMemo(() => {
    const total   = records.length;
    const exports = records.filter(r => r.Mode?.value === 'Export').length;
    const imports = records.filter(r => r.Mode?.value === 'Import').length;

    // 平均交付周期：ETA - ETD（天数），排除 <=0 的异常数据
    const cycles: number[] = [];
    records.forEach(r => {
      const etd = r.ETD?.value;
      const eta = r.ETA?.value;
      if (!etd || !eta) return;
      const days = (new Date(eta).getTime() - new Date(etd).getTime()) / 86400000;
      if (days > 0) cycles.push(days);
    });
    const avgCycle = cycles.length > 0
      ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
      : 0;

    // ── 月度件数趋势（按 ETA 月统计）──────────────────────
    const monthMap = new Map<string, number>();
    records.forEach(r => {
      const eta = r.ETA?.value;
      if (!eta) return;
      const month = eta.slice(0, 7); // "YYYY-MM"
      monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
    });
    const trendData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, 件数: count }));

    // ── 顧客别件数 Top10（柱状图）──────────────────────────
    const custMap = new Map<string, number>();
    records.forEach(r => {
      const name = r.顧客名?.value?.trim();
      if (name) custMap.set(name, (custMap.get(name) ?? 0) + 1);
    });
    const customerData = Array.from(custMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, 件数: count }));

    // ── 操作ステータス分布（饼图）──────────────────────────
    const statusMap = new Map<string, number>();
    records.forEach(r => {
      const s = r.操作ステータス?.value?.trim();
      if (s) statusMap.set(s, (statusMap.get(s) ?? 0) + 1);
    });
    const statusData = Array.from(statusMap.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    // ── Export / Import 月度对比（双柱状图）───────────────
    const modeMonthMap = new Map<string, { Export: number; Import: number }>();
    records.forEach(r => {
      const eta = r.ETA?.value;
      if (!eta) return;
      const month = eta.slice(0, 7);
      const cur   = modeMonthMap.get(month) ?? { Export: 0, Import: 0 };
      if (r.Mode?.value === 'Export') cur.Export++;
      else if (r.Mode?.value === 'Import') cur.Import++;
      modeMonthMap.set(month, cur);
    });
    const modeData = Array.from(modeMonthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));

    return { total, exports, imports, avgCycle, trendData, customerData, statusData, modeData };
  }, [records]);

  // ── 期間ボタン ─────────────────────────────────────────
  const presets = [
    { key: '1m',  label: '当月' },
    { key: '3m',  label: '3ヶ月' },
    { key: '6m',  label: '6ヶ月' },
    { key: '12m', label: '12ヶ月' },
    { key: 'all', label: '全部' },
  ];

  const cardStyle: React.CSSProperties = {
    background: C.white, borderRadius: 10,
    padding: '20px 20px 8px',
    boxShadow: '0 1px 4px rgba(0,0,0,.08)',
  };
  const titleStyle: React.CSSProperties = {
    fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12,
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* ヘッダー */}
      <header style={{
        background: C.primary, color: '#fff',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,.2)',
      }}>
        <span style={{ fontSize: 22 }}>📊</span>
        <span style={{ fontSize: 18, fontWeight: 700 }}>案件 KPI 仪表盘</span>
        {!loading && (
          <span style={{ marginLeft: 'auto', fontSize: 13, opacity: .8 }}>
            {records.length} 件のデータ
          </span>
        )}
      </header>

      <main style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── 期间选择栏 ─────────────────────────────────── */}
        <div style={{
          background: C.white, borderRadius: 10,
          padding: '14px 18px', marginBottom: 18,
          boxShadow: '0 1px 4px rgba(0,0,0,.08)',
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <span style={{ fontSize: 13, color: C.sub, marginRight: 4 }}>期间：</span>

          {/* 快捷按钮 */}
          {presets.map(p => (
            <button key={p.key} onClick={() => applyPreset(p.key)} style={{
              padding: '5px 14px', borderRadius: 20,
              border: `1px solid ${preset === p.key ? C.accent : C.border}`,
              background: preset === p.key ? C.accent : C.white,
              color: preset === p.key ? '#fff' : C.text,
              fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}>{p.label}</button>
          ))}

          {/* 手动输入 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
            <input type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPreset('custom'); }}
              style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
            <span style={{ color: C.sub }}>〜</span>
            <input type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPreset('custom'); }}
              style={{ padding: '5px 8px', borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
          </div>

          {loading && (
            <span style={{ marginLeft: 8, color: C.sub, fontSize: 13 }}>読み込み中...</span>
          )}
        </div>

        {/* エラー */}
        {error && (
          <div style={{
            background: '#fff2f0', border: '1px solid #ffccc7',
            borderRadius: 8, padding: '12px 16px', color: C.red, marginBottom: 16,
          }}>⚠ {error}</div>
        )}

        {/* ── KPI カード（4枚）──────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <KpiCard label="案件総数"     value={kpi.total}    color={C.accent}  />
          <KpiCard label="Export 件数"  value={kpi.exports}  color={C.green}   />
          <KpiCard label="Import 件数"  value={kpi.imports}  color={C.orange}  />
          <KpiCard label="平均交付周期" value={kpi.avgCycle} unit="日" color={C.purple} />
        </div>

        {/* ── 上段：月度件数趋势（折线图）────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={cardStyle}>
            <div style={titleStyle}>📈 月度件数趋势（按 ETA）</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={kpi.trendData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="件数" stroke={C.accent} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Export / Import 月度对比（双柱状图）*/}
          <div style={cardStyle}>
            <div style={titleStyle}>📊 Export / Import 月度对比</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={kpi.modeData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Export" fill={C.green}  radius={[3,3,0,0]} />
                <Bar dataKey="Import" fill={C.orange} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── 下段：顧客别件数（棒グラフ）+ 状態分布（円グラフ）*/}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={cardStyle}>
            <div style={titleStyle}>🏢 顧客别件数 Top 10</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={kpi.customerData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="件数" fill={C.accent} radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div style={titleStyle}>🥧 操作ステータス 分布</div>
            {kpi.statusData.length === 0 ? (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub }}>
                データなし
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={kpi.statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%" cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={true}
                  >
                    {kpi.statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v} 件`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
