"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import type { DashboardData } from "@/lib/dashboard";

const PIE = ["#2563eb", "#60a5fa", "#34d399", "#fbbf24", "#f472b6", "#a78bfa", "#fb7185"];
const man = (n: number) => "¥" + Math.round(n).toLocaleString("ja-JP");
const wan = (n: number) => (n / 10000).toFixed(0) + "万";

function Card({ title, children, h = 260 }: { title: string; children: React.ReactNode; h?: number }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontWeight: 650, marginBottom: 10 }}>{title}</div>
      <div style={{ width: "100%", height: h }}>
        <ResponsiveContainer width="100%" height="100%">{children as React.ReactElement}</ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardCharts({ data }: { data: DashboardData }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 16 }}>
      <Card title="经营趋势（金额 + 净利率）">
        <LineChart data={data.trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7585" }} tickFormatter={(m: string) => m.slice(5)} />
          <YAxis yAxisId="L" tickFormatter={wan} tick={{ fontSize: 12, fill: "#6b7585" }} width={46} />
          <YAxis yAxisId="R" orientation="right" tickFormatter={(v: number) => v + "%"} tick={{ fontSize: 11, fill: "#16a34a" }} width={40} />
          <Tooltip formatter={(v: number, n: string) => (n === "净利率" ? v + "%" : man(v))} />
          <Legend />
          <Line yAxisId="L" type="monotone" dataKey="毛利" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} />
          <Line yAxisId="L" type="monotone" dataKey="贩管费" stroke="#fbbf24" strokeWidth={2} dot={{ r: 3 }} />
          <Line yAxisId="L" type="monotone" dataKey="净利" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
          <Line yAxisId="R" type="monotone" dataKey="净利率" stroke="#16a34a" strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
        </LineChart>
      </Card>

      <Card title="净利 · 中日占比">
        <PieChart>
          <Pie data={data.pie中日} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.pie中日.map((_, i) => <Cell key={i} fill={PIE[i]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => man(v)} />
          <Legend />
        </PieChart>
      </Card>

      <Card title="小组利润">
        <BarChart data={data.小组} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f4" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7585" }} />
          <YAxis tickFormatter={wan} tick={{ fontSize: 12, fill: "#6b7585" }} width={48} />
          <Tooltip formatter={(v: number) => man(v)} />
          <Bar dataKey="利润" fill="#2563eb" radius={[6, 6, 0, 0]} />
        </BarChart>
      </Card>

      <Card title="贩管费 · 5 类占比">
        <PieChart>
          <Pie data={data.pie贩管费} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}>
            {data.pie贩管费.map((_, i) => <Cell key={i} fill={PIE[i % PIE.length]} />)}
          </Pie>
          <Tooltip formatter={(v: number) => man(v)} />
          <Legend />
        </PieChart>
      </Card>
    </div>
  );
}
