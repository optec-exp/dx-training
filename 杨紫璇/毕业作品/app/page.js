'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { FileBarChart, AlertOctagon, Clock, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const severityStyle = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-slate-100 text-slate-600',
}

// 精致企业级配色 — 低饱和、有层次(emerald 主导,辅 indigo/sky/violet)
const COLORS = [
  '#10b981', // emerald-500 品牌主色
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#0ea5e9', // sky-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
]

const AXIS_TICK = { fontSize: 11, fill: '#64748b' } // slate-500
const GRID_STROKE = '#e2e8f0' // slate-200

function countBy(arr, keyFn) {
  const m = {}
  for (const x of arr) {
    const k = keyFn(x)
    if (k == null) continue
    m[k] = (m[k] || 0) + 1
  }
  return m
}

function distText(arr) {
  return Object.entries(arr)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k}${v}起`)
    .join('、')
}

// 把统计结果整理成一段喂给 AI 的中文文本
function buildStatsText(records, stats, rangeLabel) {
  const tagged = records.map((r) => ({ ...r, ptype: r.problem_type || '未分类' }))
  const lines = []
  lines.push(`【分析范围】${rangeLabel},共 ${records.length} 起 NCR。`)
  lines.push('')
  lines.push('【按类型】' + stats.categoryData.map((d) => `${d.name} ${d.value} 起`).join('、'))

  const bySev = countBy(records, (r) => r.severity)
  lines.push('【按严重度】' + ['S1', 'S2', 'S3', 'S4'].filter((s) => bySev[s]).map((s) => `${s} ${bySev[s]} 起`).join('、'))

  const byMode = countBy(records, (r) => r.transport_mode)
  lines.push('【按输送领域】' + Object.entries(byMode).map(([k, v]) => `${k} ${v} 起`).join('、'))

  lines.push('【按责任部门】' + stats.deptData.map((d) => `${d.name} ${d.value} 起`).join('、'))

  const byCust = countBy(records, (r) => r.customer)
  lines.push('【按客户】' + distText(byCust))

  lines.push('【按航线】' + stats.routeData.map((d) => `${d.name} ${d.value} 起`).join('、'))
  lines.push('【按问题类型】' + distText(countBy(tagged, (r) => r.ptype)))
  lines.push(`【经济损失与状态】累计经济损失 ¥${stats.totalLoss.toLocaleString()};未结案 ${stats.openCount} 起;S4 重大案件 ${stats.s4} 起。`)

  // 交叉表一:客户 × 问题类型
  lines.push('')
  lines.push('【客户 × 问题类型】(看某客户是否集中在某类问题)')
  Object.keys(byCust)
    .sort((a, b) => byCust[b] - byCust[a])
    .forEach((c) => {
      const sub = countBy(tagged.filter((r) => r.customer === c), (r) => r.ptype)
      lines.push(`- ${c}(共${byCust[c]}起):${distText(sub)}`)
    })

  // 交叉表二:航线 × 问题类型
  lines.push('')
  lines.push('【航线 × 问题类型】(看某航线是否集中在某类问题)')
  const routeMap = {}
  tagged.forEach((r) => {
    const m = (r.summary || '').match(/[A-Z]{3}-[A-Z]{3}/)
    if (!m) return
    const route = m[0]
    routeMap[route] = routeMap[route] || {}
    routeMap[route][r.ptype] = (routeMap[route][r.ptype] || 0) + 1
  })
  Object.entries(routeMap)
    .sort((a, b) => Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0))
    .forEach(([route, sub]) => {
      const total = Object.values(sub).reduce((x, y) => x + y, 0)
      lines.push(`- ${route}(共${total}起):${distText(sub)}`)
    })

  // 交叉表三:月份 × 严重度(仅总览时有意义)
  const months = [...new Set(records.map((r) => (r.occur_date || '').slice(0, 7)).filter(Boolean))]
  if (months.length > 1) {
    lines.push('')
    lines.push('【月份 × 严重度】(看重大案件是否集中在某月)')
    const monthSev = {}
    records.forEach((r) => {
      if (!r.occur_date) return
      const ym = r.occur_date.slice(0, 7)
      monthSev[ym] = monthSev[ym] || {}
      monthSev[ym][r.severity] = (monthSev[ym][r.severity] || 0) + 1
    })
    Object.keys(monthSev).sort().forEach((ym) => {
      const sev = monthSev[ym]
      lines.push(`- ${ym}:` + ['S1', 'S2', 'S3', 'S4'].filter((s) => sev[s]).map((s) => `${s}${sev[s]}起`).join('、'))
    })
  }

  // S3/S4 重大案件概要
  const major = tagged.filter((r) => r.severity === 'S3' || r.severity === 'S4')
  if (major.length) {
    lines.push('')
    lines.push('【S3/S4 重大案件概要】')
    major.forEach((r) => {
      lines.push(`- ${r.occur_date} [${r.severity}] ${r.customer || '内部'} ${r.department}：${r.summary}(损失 ¥${Number(r.economic_loss || 0).toLocaleString()})`)
    })
  }
  return lines.join('\n')
}

function StatCard({ label, value, accent, icon: Icon, bar }) {
  return (
    <div className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      {bar && <div className={`h-1 ${bar}`} />}
      <div className="flex items-start justify-between p-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
          <div className={`mt-1.5 text-2xl font-bold tabular-nums ${accent || 'text-slate-900'}`}>{value}</div>
        </div>
        {Icon && <Icon size={22} className="text-slate-300 transition-colors group-hover:text-slate-400" />}
      </div>
    </div>
  )
}

function FilterRow({ label, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-10 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      {children}
    </div>
  )
}

export default function Home() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedDept, setSelectedDept] = useState('all')

  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState('')
  const [analysisError, setAnalysisError] = useState(null)
  const [showRaw, setShowRaw] = useState(false)
  const [hideReport, setHideReport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('ncr_records')
        .select('*')
        .is('deleted_at', null)
        .order('occur_date', { ascending: false })
      if (error) setError(error.message)
      else setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const years = useMemo(() => {
    const set = new Set(records.map((r) => (r.occur_date || '').slice(0, 4)).filter(Boolean))
    return [...set].sort()
  }, [records])

  const months = useMemo(() => {
    const inYear = selectedYear === 'all'
      ? records
      : records.filter((r) => (r.occur_date || '').slice(0, 4) === selectedYear)
    const set = new Set(inYear.map((r) => (r.occur_date || '').slice(0, 7)).filter(Boolean))
    return [...set].sort()
  }, [records, selectedYear])

  const depts = useMemo(() => {
    const set = new Set(records.map((r) => r.department).filter(Boolean))
    return [...set].sort()
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (selectedYear !== 'all' && (r.occur_date || '').slice(0, 4) !== selectedYear) return false
      if (selectedMonth !== 'all' && (r.occur_date || '').slice(0, 7) !== selectedMonth) return false
      if (selectedDept !== 'all' && r.department !== selectedDept) return false
      return true
    })
  }, [records, selectedYear, selectedMonth, selectedDept])

  const rangeLabel = [
    selectedYear === 'all' ? '近 6 个月' : `${selectedYear} 年`,
    selectedMonth !== 'all' ? `${selectedMonth} 月` : null,
    selectedDept !== 'all' ? selectedDept : null,
  ].filter(Boolean).join(' · ')

  const stats = useMemo(() => {
    const byCategory = countBy(filtered, (r) => r.category)

    const routeCounts = {}
    for (const r of filtered) {
      const m = (r.summary || '').match(/[A-Z]{3}-[A-Z]{3}/)
      if (m) routeCounts[m[0]] = (routeCounts[m[0]] || 0) + 1
    }

    const byDept = countBy(filtered, (r) => r.department)
    const byProblem = countBy(filtered, (r) => r.problem_type || '未分类')

    const byMonth = {}
    for (const r of filtered) {
      if (!r.occur_date) continue
      const ym = r.occur_date.slice(0, 7)
      byMonth[ym] = (byMonth[ym] || 0) + 1
    }

    const totalLoss = filtered.reduce((s, r) => s + (Number(r.economic_loss) || 0), 0)
    const s4 = filtered.filter((r) => r.severity === 'S4').length
    const openCount = filtered.filter((r) => r.status === 'open').length

    return {
      categoryData: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
      routeData: Object.entries(routeCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      deptData: Object.entries(byDept)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      problemData: Object.entries(byProblem)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      monthData: Object.entries(byMonth)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      totalLoss,
      s4,
      openCount,
    }
  }, [filtered])

  function resetAnalysisState() {
    setAnalysis('')
    setAnalysisError(null)
    setSaveMsg(null)
  }
  function handleSelectMonth(m) {
    setSelectedMonth(m)
    resetAnalysisState()
  }
  function handleSelectYear(y) {
    setSelectedYear(y)
    setSelectedMonth('all')  // 切年时清月份(因为新年下可能没有原来的月)
    resetAnalysisState()
  }
  function handleSelectDept(d) {
    setSelectedDept(d)
    resetAnalysisState()
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalysisError(null)
    setAnalysis('')
    setHideReport(false)
    setSaveMsg(null)
    try {
      const statsText = buildStatsText(filtered, stats, rangeLabel)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statsText }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || '分析失败')
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        setAnalysis(acc)
      }
    } catch (err) {
      setAnalysisError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const title = `${selectedMonth === 'all' ? '近6个月' : selectedMonth} NCR分析报告`
      const { error } = await supabase.from('analysis_reports').insert({
        title,
        analysis_result: analysis,
        data_snapshot: { rangeLabel, statsText: buildStatsText(filtered, stats, rangeLabel), stats },
      })
      if (error) throw new Error(error.message)
      setSaveMsg(`已保存到历史报告:${title} ✓`)
    } catch (err) {
      setSaveMsg('保存失败:' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const monthBtn = (active) =>
    `rounded-md px-3 py-1.5 text-sm transition-colors ${
      active ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
    }`

  return (
    <main className="px-6 py-8 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-1">
          <h1 className="text-2xl font-bold tracking-tight">品质分析看板</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? '加载中…' : `当前范围:${rangeLabel} · 共 ${filtered.length} 条记录`}
          </p>
        </div>

        {!loading && !error && (
          <div className="mb-6 space-y-2">
            {years.length > 1 && (
              <FilterRow label="年度">
                <button onClick={() => handleSelectYear('all')} className={monthBtn(selectedYear === 'all')}>全部年度</button>
                {years.map((y) => (
                  <button key={y} onClick={() => handleSelectYear(y)} className={monthBtn(selectedYear === y)}>{y}</button>
                ))}
              </FilterRow>
            )}
            <FilterRow label="月份">
              <button onClick={() => handleSelectMonth('all')} className={monthBtn(selectedMonth === 'all')}>全部月份</button>
              {months.map((m) => (
                <button key={m} onClick={() => handleSelectMonth(m)} className={monthBtn(selectedMonth === m)}>{m}</button>
              ))}
            </FilterRow>
            {depts.length > 0 && (
              <FilterRow label="部门">
                <button onClick={() => handleSelectDept('all')} className={monthBtn(selectedDept === 'all')}>全部部门</button>
                {depts.map((d) => (
                  <button key={d} onClick={() => handleSelectDept(d)} className={monthBtn(selectedDept === d)}>{d}</button>
                ))}
              </FilterRow>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded bg-red-50 p-4 text-red-700">读取数据出错:{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="NCR 总数" value={filtered.length} icon={FileBarChart} bar="bg-emerald-500" />
              <StatCard label="S4 重大案件" value={stats.s4} accent="text-red-600" icon={AlertOctagon} bar="bg-red-500" />
              <StatCard label="未结案" value={stats.openCount} accent="text-blue-600" icon={Clock} bar="bg-blue-500" />
              <StatCard label="累计经济损失" value={`¥${stats.totalLoss.toLocaleString()}`} accent="text-orange-600" icon={Wallet} bar="bg-orange-500" />
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
              {/* 左列:图表 + 原始表格(很长) */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ChartCard title="① 问题类型分布">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={stats.problemData} dataKey="value" nameKey="name" outerRadius={75} innerRadius={35} paddingAngle={2} stroke="white" strokeWidth={2} label={(e) => e.value} labelLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}>
                          {stats.problemData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          content={({ payload }) => (
                            <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
                              {payload?.map((entry, i) => (
                                <li key={i} className="inline-flex items-center gap-1.5">
                                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span>{entry.value}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="② 各航线异常数">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.routeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                        <XAxis dataKey="name" interval={0} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} width={32} />
                        <Tooltip />
                        <Bar dataKey="value" name="异常数" fill="#6366f1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="③ 责任部门分布">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.deptData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={AXIS_TICK} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} width={32} />
                        <Tooltip />
                        <Bar dataKey="value" name="异常数" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {selectedMonth === 'all' && (
                    <ChartCard title="④ 月度趋势">
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={stats.monthData} margin={{ top: 5, right: 25, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                          <XAxis dataKey="name" interval={0} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} width={32} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" name="异常数" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>

                <h2 className="mb-3 mt-8 text-lg font-semibold">原始记录</h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <colgroup><col className="w-28" /><col className="w-20" /><col className="w-16" /><col className="w-28" /><col className="w-28" /><col className="w-16" /><col className="w-20" /><col /><col className="w-28" /><col className="w-16" /></colgroup>
                    <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="whitespace-nowrap px-3 py-2">发生日期</th>
                        <th className="whitespace-nowrap px-3 py-2">分类</th>
                        <th className="whitespace-nowrap px-3 py-2">严重度</th>
                        <th className="whitespace-nowrap px-3 py-2">问题类型</th>
                        <th className="whitespace-nowrap px-3 py-2">部门</th>
                        <th className="whitespace-nowrap px-3 py-2">领域</th>
                        <th className="whitespace-nowrap px-3 py-2">客户</th>
                        <th className="whitespace-nowrap px-3 py-2">事件概要</th>
                        <th className="whitespace-nowrap px-3 py-2 text-right">经济损失</th>
                        <th className="whitespace-nowrap px-3 py-2">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="whitespace-nowrap px-3 py-2">{r.occur_date}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.category}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyle[r.severity] || 'bg-slate-100 text-slate-600'}`}>
                              {r.severity}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">{r.problem_type || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.department}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.transport_mode}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.customer || '—'}</td>
                          <td className="px-3 py-2">
                        <Link href={`/ncr/${r.id}`} className="text-blue-700 hover:underline">
                          {r.summary}
                        </Link>
                      </td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            {r.economic_loss != null ? `¥${Number(r.economic_loss).toLocaleString()}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-2 py-0.5 text-xs ${r.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 右列:AI 分析(吸顶) */}
              <div className="mt-6 lg:col-span-1 lg:mt-0 lg:sticky lg:top-8 lg:max-h-[calc(100vh_-_4rem)] lg:overflow-y-auto">
                <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                  <button
                    type="button"
                    onClick={() => analysis && setHideReport((v) => !v)}
                    className="mb-4 flex w-full items-center text-left text-lg font-semibold"
                    title={analysis ? '点击折叠 / 展开报告' : undefined}
                  >
                    AI 品质分析 · {rangeLabel}
                    {analysis && (
                      <span className="ml-2 text-sm font-normal text-slate-400">{hideReport ? '▶ 展开' : '▼ 收起'}</span>
                    )}
                  </button>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowRaw((v) => !v)}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      {showRaw ? '隐藏数据' : '查看发给 AI 的数据'}
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || filtered.length === 0}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {analyzing ? '分析中…' : '开始分析'}
                    </button>
                    {analysis && !analyzing && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md border border-emerald-600 px-3 py-2 text-sm text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                      >
                        {saving ? '保存中…' : '保存报告'}
                      </button>
                    )}
                  </div>
                  {saveMsg && <p className="mb-3 text-sm text-emerald-700">{saveMsg}</p>}

                  {showRaw && (
                    <pre className="mb-4 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
                      {buildStatsText(filtered, stats, rangeLabel)}
                    </pre>
                  )}

                  {analysisError && (
                    <div className="rounded bg-red-50 p-3 text-sm text-red-700">分析出错:{analysisError}</div>
                  )}
                  {analyzing && (
                    <p className="text-sm text-slate-500">AI 正在分析,请稍候(约 5~15 秒)…</p>
                  )}
                  {analysis && !hideReport && (
                    <article className="prose prose-sm max-w-none">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </article>
                  )}
                  {analysis && hideReport && (
                    <p className="text-sm text-slate-400">报告已隐藏,点「展开报告」查看。</p>
                  )}
                  {!analysis && !analyzing && !analysisError && (
                    <p className="text-sm text-slate-400">
                      点击「开始分析」,让 AI 基于{rangeLabel}的数据生成趋势 / 根因 / 改进建议报告。
                    </p>
                  )}
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
