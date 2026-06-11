"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, Cell as C, LineChart, Line, LabelList } from "recharts";

const PALETTE = ["#2563eb", "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#fb7185", "#22d3ee"];
const man = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const wan = (n: number) => (Math.abs(n) >= 10000 ? (n / 10000).toFixed(0) + "万" : String(Math.round(n)));

function Frame({ title, children, h = 240 }: { title: string; children: React.ReactNode; h?: number }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 650, marginBottom: 8 }}>{title}</div>
      <div style={{ width: "100%", height: h }}>
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </div>
  );
}

export function BarCard({ title, data, xKey, barKey, colorByValue, tilt, onBarClick, activeCat, colors }: { title: string; data: Record<string, unknown>[]; xKey: string; barKey: string; colorByValue?: boolean; tilt?: boolean; onBarClick?: (cat: string) => void; activeCat?: string | null; colors?: Record<string, string> }) {
  const fillOf = (d: Record<string, unknown>, i: number) => {
    if (colorByValue && Number(d[barKey]) < 0) return "#dc2626";
    if (colors && colors[String(d[xKey])]) return colors[String(d[xKey])];
    return PALETTE[i % PALETTE.length];
  };
  return (
    <Frame title={title} h={tilt ? 300 : 240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: tilt ? 36 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
        <XAxis dataKey={xKey} tick={{ fontSize: tilt ? 10 : 11, fill: "#6b7585" }} interval={tilt ? 0 : "preserveEnd"} angle={tilt ? -35 : 0} textAnchor={tilt ? "end" : "middle"} height={tilt ? 64 : undefined} />
        <YAxis tickFormatter={wan} tick={{ fontSize: 12, fill: "#6b7585" }} width={48} />
        <Tooltip formatter={(v: number) => man(v)} />
        <Bar dataKey={barKey} radius={[6, 6, 0, 0]} cursor={onBarClick ? "pointer" : undefined} onClick={onBarClick ? (e: { payload?: Record<string, unknown> }) => { const cat = e?.payload?.[xKey]; if (cat != null) onBarClick(String(cat)); } : undefined}>
          {data.map((d, i) => { const f = fillOf(d, i); const dim = activeCat != null && String(d[xKey]) !== activeCat; return <C key={i} fill={f} fillOpacity={dim ? 0.35 : 1} />; })}
        </Bar>
      </BarChart>
    </Frame>
  );
}

// 横向柱状图（带金额标签，支持负数）—— 适合"一大多小+有负值"的数据（如贩管费 5 类）。
export function HBarCard({ title, data, catKey, valKey }: { title: string; data: Record<string, unknown>[]; catKey: string; valKey: string }) {
  return (
    <Frame title={title} h={Math.max(180, data.length * 46)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 84, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" horizontal={false} />
        <XAxis type="number" tickFormatter={wan} tick={{ fontSize: 11, fill: "#6b7585" }} />
        <YAxis type="category" dataKey={catKey} width={100} tick={{ fontSize: 12, fill: "#3b4252" }} />
        <Tooltip formatter={(v: number) => man(v)} />
        <Bar dataKey={valKey} radius={[0, 6, 6, 0]} isAnimationActive={false}>
          {data.map((d, i) => <C key={i} fill={Number(d[valKey]) < 0 ? "#dc2626" : PALETTE[i % PALETTE.length]} />)}
          <LabelList dataKey={valKey} position="right" formatter={(v: number) => man(v)} style={{ fontSize: 11, fill: "#6b7585" }} />
        </Bar>
      </BarChart>
    </Frame>
  );
}

// 分组柱状图（每类别多根柱，如小组×毛利/贩管费/净利）。
export function GroupedBarCard({ title, data, xKey, bars, h, count }: { title: string; data: Record<string, unknown>[]; xKey: string; bars: { key: string; name: string; color: string }[]; h?: number; count?: boolean }) {
  const yFmt = count ? (n: number) => String(Math.round(n)) : wan;
  const tFmt = count ? (n: number) => `${Math.round(n)} 件` : man;
  return (
    <Frame title={title} h={h ?? 260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#6b7585" }} />
        <YAxis tickFormatter={yFmt} allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7585" }} width={count ? 32 : 48} />
        <Tooltip formatter={(v: number) => tFmt(v)} />
        <Legend />
        {bars.map((b) => <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </Frame>
  );
}

export function LineCard({ title, data, xKey, lines, h }: { title: string; data: Record<string, unknown>[]; xKey: string; lines: { key: string; name: string; color: string }[]; h?: number }) {
  return (
    <Frame title={title} h={h ?? 240}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#6b7585" }} />
        <YAxis tickFormatter={wan} tick={{ fontSize: 12, fill: "#6b7585" }} width={52} />
        <Tooltip formatter={(v: number) => man(v)} />
        {lines.length > 1 && <Legend />}
        {lines.map((l) => <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={{ r: 3 }} />)}
      </LineChart>
    </Frame>
  );
}

export function PieCard({ title, data, nameKey = "name", valueKey = "value" }: { title: string; data: Record<string, unknown>[]; nameKey?: string; valueKey?: string }) {
  return (
    <Frame title={title}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => man(v)} />
        <Legend />
      </PieChart>
    </Frame>
  );
}
