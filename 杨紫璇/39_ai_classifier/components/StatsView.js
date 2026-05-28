'use client'

import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#6b7280']

export default function StatsView() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('classifications').select('*')
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-gray-500">加载中…</p>
  if (records.length === 0) return <p className="text-gray-500">还没有数据可统计。</p>

  const total = records.length
  const avgConfidence = Math.round(
    (records.reduce((sum, r) => sum + Number(r.confidence), 0) / total) * 100
  )
  const lowCount = records.filter((r) => Number(r.confidence) < 0.5).length

  const counts = {}
  for (const r of records) {
    counts[r.category] = (counts[r.category] || 0) + 1
  }
  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Card label="总分类数" value={total} />
        <Card label="平均置信度" value={`${avgConfidence}%`} />
        <Card label="低置信度(<50%)" value={lowCount} hint="需复核" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 mb-2">各类别占比</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={90} label>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 mb-2">各类别数量</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-500 mb-3">各类别明细</h2>
        <div className="space-y-1">
          {chartData.map((d) => (
            <div key={d.name} className="flex justify-between text-sm">
              <span className="text-gray-700">{d.name}</span>
              <span className="text-gray-500">{d.value} 条</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Card({ label, value, hint }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {hint && <p className="text-xs text-red-500 mt-0.5">{hint}</p>}
    </div>
  )
}
