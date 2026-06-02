'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Archive } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Spinner, EmptyState, FilterRow, FilterButton } from '@/lib/ui'

const severityStyle = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-slate-100 text-slate-600',
}

const RESULT_STYLE = {
  '有效':       'bg-emerald-100 text-emerald-700',
  '部分有效':   'bg-yellow-100 text-yellow-700',
  '无效':       'bg-red-100 text-red-700',
  '需追加CAPA': 'bg-orange-100 text-orange-700',
}

export default function ClosedNCRPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedDept, setSelectedDept] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('ncr_records')
        .select('*')
        .eq('status', 'closed')
        .is('deleted_at', null)
        .order('closed_at', { ascending: false })
      if (error) setError(error.message)
      else setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const years = useMemo(() => {
    const set = new Set(records.map((r) => (r.closed_at || '').slice(0, 4)).filter(Boolean))
    return [...set].sort()
  }, [records])
  const depts = useMemo(() => {
    const set = new Set(records.map((r) => r.department).filter(Boolean))
    return [...set].sort()
  }, [records])
  const categories = useMemo(() => {
    const set = new Set(records.map((r) => r.root_cause_category).filter(Boolean))
    return [...set].sort()
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (selectedYear !== 'all' && (r.closed_at || '').slice(0, 4) !== selectedYear) return false
      if (selectedDept !== 'all' && r.department !== selectedDept) return false
      if (selectedCategory !== 'all' && r.root_cause_category !== selectedCategory) return false
      return true
    })
  }, [records, selectedYear, selectedDept, selectedCategory])

  // 按"根本原因类别"统计(品质统计常用)
  const categoryStats = filtered.reduce((m, r) => {
    const k = r.root_cause_category || '(未填)'
    m[k] = (m[k] || 0) + 1
    return m
  }, {})
  const totalLoss = filtered.reduce((s, r) => s + (Number(r.economic_loss) || 0), 0)

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">已结案 NCR</h1>
        </div>

        {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> 加载中…</div>}
        {error && <div className="rounded bg-red-50 p-4 text-red-700">读取出错:{error}</div>}

        {!loading && !error && records.length === 0 && (
          <EmptyState icon={Archive} title="还没有已结案的 NCR" hint="完成 ⑦⑧ 效果验证并选择根本原因后可结案。" />
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <div className="mb-6 space-y-2">
              {years.length > 1 && (
                <FilterRow label="年度">
                  <FilterButton active={selectedYear === 'all'} onClick={() => setSelectedYear('all')}>全部年度</FilterButton>
                  {years.map((y) => (
                    <FilterButton key={y} active={selectedYear === y} onClick={() => setSelectedYear(y)}>{y}</FilterButton>
                  ))}
                </FilterRow>
              )}
              {depts.length > 0 && (
                <FilterRow label="部门">
                  <FilterButton active={selectedDept === 'all'} onClick={() => setSelectedDept('all')}>全部部门</FilterButton>
                  {depts.map((d) => (
                    <FilterButton key={d} active={selectedDept === d} onClick={() => setSelectedDept(d)}>{d}</FilterButton>
                  ))}
                </FilterRow>
              )}
              {categories.length > 0 && (
                <FilterRow label="根因">
                  <FilterButton active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>全部根因</FilterButton>
                  {categories.map((c) => (
                    <FilterButton key={c} active={selectedCategory === c} onClick={() => setSelectedCategory(c)}>{c}</FilterButton>
                  ))}
                </FilterRow>
              )}
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">已结案总数</div>
                <div className="mt-1 text-2xl font-bold">{filtered.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">累计经济损失</div>
                <div className="mt-1 text-2xl font-bold text-orange-600">¥{totalLoss.toLocaleString()}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-sm text-slate-500">根本原因类别分布</div>
                <div className="mt-1 text-xs text-slate-700">
                  {Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                    <span key={k} className="mr-2 inline-block rounded bg-slate-100 px-1.5 py-0.5">
                      {k} {v}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2">结案时间</th>
                    <th className="whitespace-nowrap px-3 py-2">发生日期</th>
                    <th className="whitespace-nowrap px-3 py-2">严重度</th>
                    <th className="whitespace-nowrap px-3 py-2">根本原因类别</th>
                    <th className="whitespace-nowrap px-3 py-2">部门</th>
                    <th className="whitespace-nowrap px-3 py-2">客户</th>
                    <th className="whitespace-nowrap px-3 py-2">事件概要</th>
                    <th className="whitespace-nowrap px-3 py-2">30d / 90d 验证</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                        {r.closed_at ? new Date(r.closed_at).toLocaleString('zh-CN') : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.occur_date}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyle[r.severity] || 'bg-slate-100 text-slate-600'}`}>
                          {r.severity || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-medium">{r.root_cause_category || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.department}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.customer || '—'}</td>
                      <td className="px-3 py-2">
                        <Link href={`/ncr/${r.id}`} className="text-blue-700 hover:underline">
                          {r.summary}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        <span className={`mr-1 rounded px-1.5 py-0.5 ${RESULT_STYLE[r.effect_30d_result] || 'bg-slate-100 text-slate-600'}`}>
                          {r.effect_30d_result || '—'}
                        </span>
                        <span className={`rounded px-1.5 py-0.5 ${RESULT_STYLE[r.effect_90d_result] || 'bg-slate-100 text-slate-600'}`}>
                          {r.effect_90d_result || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
