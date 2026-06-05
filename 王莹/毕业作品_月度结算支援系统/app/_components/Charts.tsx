"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend, Cell as C } from "recharts";

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

export function BarCard({ title, data, xKey, barKey, colorByValue }: { title: string; data: Record<string, unknown>[]; xKey: string; barKey: string; colorByValue?: boolean }) {
  return (
    <Frame title={title}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#6b7585" }} />
        <YAxis tickFormatter={wan} tick={{ fontSize: 12, fill: "#6b7585" }} width={48} />
        <Tooltip formatter={(v: number) => man(v)} />
        <Bar dataKey={barKey} radius={[6, 6, 0, 0]}>
          {data.map((d, i) => <C key={i} fill={colorByValue && Number(d[barKey]) < 0 ? "#dc2626" : PALETTE[i % PALETTE.length]} />)}
        </Bar>
      </BarChart>
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
