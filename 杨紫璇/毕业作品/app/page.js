'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { supabase } from '@/lib/supabase'
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

const severityStyle = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-gray-100 text-gray-600',
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6', '#eab308']

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

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent || 'text-gray-800'}`}>{value}</div>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">{title}</h3>
      {children}
    </div>
  )
}

export default function Home() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedMonth, setSelectedMonth] = useState('all')

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
        .order('occur_date', { ascending: false })
      if (error) setError(error.message)
      else setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const months = useMemo(() => {
    const set = new Set(records.map((r) => (r.occur_date || '').slice(0, 7)).filter(Boolean))
    return [...set].sort()
  }, [records])

  const filtered = useMemo(() => {
    if (selectedMonth === 'all') return records
    return records.filter((r) => (r.occur_date || '').slice(0, 7) === selectedMonth)
  }, [records, selectedMonth])

  const rangeLabel = selectedMonth === 'all' ? '近 6 个月' : `${selectedMonth} 月`

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

  function handleSelectMonth(m) {
    setSelectedMonth(m)
    setAnalysis('')
    setAnalysisError(null)
    setSaveMsg(null)
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
      active ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
    }`

  return (
    <main className="min-h-screen bg-gray-50 p-8 text-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">货代 NCR 品质分析看板</h1>
          <Link href="/reports" className="text-sm text-blue-600 hover:underline">
            历史报告 →
          </Link>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          {loading ? '加载中…' : `当前范围:${rangeLabel} · 共 ${filtered.length} 条记录`}
        </p>

        {!loading && !error && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button onClick={() => handleSelectMonth('all')} className={monthBtn(selectedMonth === 'all')}>
              全部(近 6 个月)
            </button>
            {months.map((m) => (
              <button key={m} onClick={() => handleSelectMonth(m)} className={monthBtn(selectedMonth === m)}>
                {m}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded bg-red-50 p-4 text-red-700">读取数据出错:{error}</div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard label="NCR 总数" value={filtered.length} />
              <StatCard label="S4 重大案件" value={stats.s4} accent="text-red-600" />
              <StatCard label="未结案" value={stats.openCount} accent="text-blue-600" />
              <StatCard label="累计经济损失" value={`¥${stats.totalLoss.toLocaleString()}`} accent="text-orange-600" />
            </div>

            <div className="lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
              {/* 左列:图表 + 原始表格(很长) */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ChartCard title="① 问题类型分布">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={stats.problemData} dataKey="value" nameKey="name" outerRadius={70} label={(e) => e.value}>
                          {stats.problemData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="② 各航线异常数">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.routeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" name="异常数" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  <ChartCard title="③ 责任部门分布">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.deptData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" name="异常数" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartCard>

                  {selectedMonth === 'all' && (
                    <ChartCard title="④ 月度趋势">
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={stats.monthData} margin={{ top: 5, right: 25, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" name="异常数" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>

                <h2 className="mb-3 mt-8 text-lg font-semibold">原始记录</h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 text-left text-gray-600">
                      <tr>
                        <th className="px-3 py-2">发生日期</th>
                        <th className="px-3 py-2">分类</th>
                        <th className="px-3 py-2">严重度</th>
                        <th className="px-3 py-2">问题类型</th>
                        <th className="px-3 py-2">部门</th>
                        <th className="px-3 py-2">领域</th>
                        <th className="px-3 py-2">客户</th>
                        <th className="px-3 py-2">事件概要</th>
                        <th className="px-3 py-2 text-right">经济损失</th>
                        <th className="px-3 py-2">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="whitespace-nowrap px-3 py-2">{r.occur_date}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.category}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyle[r.severity] || 'bg-gray-100 text-gray-600'}`}>
                              {r.severity}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">{r.problem_type || '—'}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.department}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.transport_mode}</td>
                          <td className="whitespace-nowrap px-3 py-2">{r.customer || '—'}</td>
                          <td className="px-3 py-2">{r.summary}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-right">
                            {r.economic_loss != null ? `¥${Number(r.economic_loss).toLocaleString()}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-2 py-0.5 text-xs ${r.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
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
                <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <button
                    type="button"
                    onClick={() => analysis && setHideReport((v) => !v)}
                    className="mb-4 flex w-full items-center text-left text-lg font-semibold"
                    title={analysis ? '点击折叠 / 展开报告' : undefined}
                  >
                    AI 品质分析 · {rangeLabel}
                    {analysis && (
                      <span className="ml-2 text-sm font-normal text-gray-400">{hideReport ? '▶ 展开' : '▼ 收起'}</span>
                    )}
                  </button>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowRaw((v) => !v)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      {showRaw ? '隐藏数据' : '查看发给 AI 的数据'}
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || filtered.length === 0}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                    >
                      {analyzing ? '分析中…' : '开始分析'}
                    </button>
                    {analysis && !analyzing && (
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-md border border-green-600 px-3 py-2 text-sm text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50"
                      >
                        {saving ? '保存中…' : '保存报告'}
                      </button>
                    )}
                  </div>
                  {saveMsg && <p className="mb-3 text-sm text-green-700">{saveMsg}</p>}

                  {showRaw && (
                    <pre className="mb-4 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
                      {buildStatsText(filtered, stats, rangeLabel)}
                    </pre>
                  )}

                  {analysisError && (
                    <div className="rounded bg-red-50 p-3 text-sm text-red-700">分析出错:{analysisError}</div>
                  )}
                  {analyzing && (
                    <p className="text-sm text-gray-500">AI 正在分析,请稍候(约 5~15 秒)…</p>
                  )}
                  {analysis && !hideReport && (
                    <article className="prose prose-sm max-w-none">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </article>
                  )}
                  {analysis && hideReport && (
                    <p className="text-sm text-gray-400">报告已隐藏,点「展开报告」查看。</p>
                  )}
                  {!analysis && !analyzing && !analysisError && (
                    <p className="text-sm text-gray-400">
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
