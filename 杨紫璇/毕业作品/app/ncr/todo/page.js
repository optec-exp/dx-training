'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { CheckCircle2 } from 'lucide-react'
import { isOverdue, getCurrentStage, getStageStatus, SLA_LABELS } from '@/lib/sla'
import { Spinner, EmptyState, FilterRow, FilterButton } from '@/lib/ui'

const severityStyle = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-slate-100 text-slate-600',
}

const STAGE_DUE_FIELD = {
  containment:     'sla_containment_due',
  root_cause:      'sla_root_cause_due',
  corrective_plan: 'sla_corrective_plan_due',
  corrective_done: 'sla_corrective_done_due',
  preventive_plan: 'sla_preventive_plan_due',
  preventive_done: 'sla_preventive_done_due',
}

const STAGE_OWNER_FIELD = {
  containment:     'containment_owner',
  root_cause:      'root_cause_owner',
  corrective_plan: 'corrective_owner',
  corrective_done: 'corrective_owner',
  preventive_plan: 'preventive_owner',
  preventive_done: 'preventive_owner',
}

const SEVERITIES = ['S1', 'S2', 'S3', 'S4']

export default function TodoPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSeverity, setSelectedSeverity] = useState('all')
  const [selectedDept, setSelectedDept] = useState('all')

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('ncr_records')
        .select('*')
        .eq('status', 'open')
        .is('deleted_at', null)
      if (error) setError(error.message)
      else setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const depts = useMemo(() => {
    const set = new Set(records.map((r) => r.department).filter(Boolean))
    return [...set].sort()
  }, [records])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (selectedSeverity !== 'all' && r.severity !== selectedSeverity) return false
      if (selectedDept !== 'all' && r.department !== selectedDept) return false
      return true
    })
  }, [records, selectedSeverity, selectedDept])

  // 按"当前阶段的截止时间"排序(超期/最近的在前)
  const sorted = [...filtered].sort((a, b) => {
    const stageA = getCurrentStage(a)
    const stageB = getCurrentStage(b)
    const dueA = stageA ? a[STAGE_DUE_FIELD[stageA]] : null
    const dueB = stageB ? b[STAGE_DUE_FIELD[stageB]] : null
    if (!dueA && !dueB) return 0
    if (!dueA) return 1
    if (!dueB) return -1
    return new Date(dueA).getTime() - new Date(dueB).getTime()
  })

  const overdueCount = sorted.filter((r) => {
    const stage = getCurrentStage(r)
    return stage && isOverdue(r[STAGE_DUE_FIELD[stage]])
  }).length

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">NCR 待办列表(未结案)</h1>
        </div>

        {!loading && !error && (
          <>
            <p className="mb-4 text-sm text-slate-500">
              共 {sorted.length} 条未结案 · 其中 <span className="font-semibold text-red-600">{overdueCount}</span> 条当前阶段已超期
            </p>
            <div className="mb-6 space-y-2">
              <FilterRow label="严重度">
                <FilterButton active={selectedSeverity === 'all'} onClick={() => setSelectedSeverity('all')}>全部</FilterButton>
                {SEVERITIES.map((s) => (
                  <FilterButton key={s} active={selectedSeverity === s} onClick={() => setSelectedSeverity(s)}>{s}</FilterButton>
                ))}
              </FilterRow>
              {depts.length > 0 && (
                <FilterRow label="部门">
                  <FilterButton active={selectedDept === 'all'} onClick={() => setSelectedDept('all')}>全部部门</FilterButton>
                  {depts.map((d) => (
                    <FilterButton key={d} active={selectedDept === d} onClick={() => setSelectedDept(d)}>{d}</FilterButton>
                  ))}
                </FilterRow>
              )}
            </div>
          </>
        )}

        {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> 加载中…</div>}
        {error && <div className="rounded bg-red-50 p-4 text-red-700">读取出错:{error}</div>}

        {!loading && !error && sorted.length === 0 && (
          <EmptyState icon={CheckCircle2} title="没有未结案的 NCR" hint="所有 NCR 都已完成 ✓" />
        )}

        {!loading && !error && sorted.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2">发生日期</th>
                  <th className="whitespace-nowrap px-3 py-2">严重度</th>
                  <th className="whitespace-nowrap px-3 py-2">问题类型</th>
                  <th className="whitespace-nowrap px-3 py-2">部门</th>
                  <th className="whitespace-nowrap px-3 py-2">客户</th>
                  <th className="whitespace-nowrap px-3 py-2">事件概要</th>
                  <th className="whitespace-nowrap px-3 py-2">当前阶段</th>
                  <th className="whitespace-nowrap px-3 py-2">阶段负责人</th>
                  <th className="whitespace-nowrap px-3 py-2">阶段 SLA + 状态</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const stage = getCurrentStage(r)
                  const stageOwner = stage ? r[STAGE_OWNER_FIELD[stage]] : null
                  const status = stage ? getStageStatus(r, stage) : null
                  const overdueRow = stage && isOverdue(r[STAGE_DUE_FIELD[stage]])
                  return (
                    <tr key={r.id} className={`border-t border-slate-100 ${overdueRow ? 'bg-red-50/40' : 'hover:bg-slate-50'}`}>
                      <td className="whitespace-nowrap px-3 py-2">{r.occur_date}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyle[r.severity] || 'bg-slate-100 text-slate-600'}`}>
                          {r.severity || '—'}
                        </span>
                        {r.severity === 'S4' && <div className="mt-1 text-xs font-medium text-red-600">需通知社长</div>}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{r.problem_type || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.department}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.customer || '—'}</td>
                      <td className="px-3 py-2">
                        <Link href={`/ncr/${r.id}`} className="text-blue-700 hover:underline">{r.summary}</Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{stage ? SLA_LABELS[stage] : '✓ 全阶段完成'}</td>
                      <td className="whitespace-nowrap px-3 py-2">{stageOwner || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs">
                        {status ? (
                          <>
                            <div className="text-slate-500">截止 {status.dueText}</div>
                            <div className={`font-medium ${status.color}`}>{status.badge}</div>
                          </>
                        ) : (
                          <span className="text-emerald-600">待结案</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
