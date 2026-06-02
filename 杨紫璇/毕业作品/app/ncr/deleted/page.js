'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RotateCcw, Trash2, Inbox } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { confirmToast, toast, Spinner, EmptyState } from '@/lib/ui'

const severityStyle = {
  S4: 'bg-red-100 text-red-700',
  S3: 'bg-orange-100 text-orange-700',
  S2: 'bg-yellow-100 text-yellow-700',
  S1: 'bg-slate-100 text-slate-600',
}

export default function DeletedNCRPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('ncr_records')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    if (error) setError(error.message)
    else setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function handleRestore(id) {
    confirmToast('恢复这条 NCR?', async () => {
      setBusyId(id)
      const { error } = await supabase.from('ncr_records').update({ deleted_at: null }).eq('id', id)
      setBusyId(null)
      if (error) { toast.error('恢复失败:' + error.message); return }
      toast.success('已恢复')
      await load()
    }, { description: '恢复后将重新出现在看板和待办', confirmLabel: '恢复' })
  }

  function handlePurge(id) {
    confirmToast('永久删除这条 NCR?', async () => {
      setBusyId(id)
      const { error } = await supabase.from('ncr_records').delete().eq('id', id)
      setBusyId(null)
      if (error) { toast.error('删除失败:' + error.message); return }
      toast.success('已永久删除')
      await load()
    }, { description: '⚠ 数据不可恢复', confirmLabel: '永久删除' })
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">历史删除 NCR</h1>
        </div>

        {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> 加载中…</div>}
        {error && <div className="rounded bg-red-50 p-4 text-red-700">读取出错:{error}</div>}

        {!loading && !error && records.length === 0 && (
          <EmptyState icon={Inbox} title="没有已删除的 NCR" hint="所有 NCR 都还在使用中。" />
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <p className="mb-4 text-sm text-slate-500">共 {records.length} 条已删除。可恢复(重新启用)或永久删除(不可恢复)。</p>
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
                    <th className="whitespace-nowrap px-3 py-2">删除时间</th>
                    <th className="whitespace-nowrap px-3 py-2">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.occur_date}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${severityStyle[r.severity] || 'bg-slate-100 text-slate-600'}`}>
                          {r.severity || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.problem_type || '—'}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.department}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-500">{r.customer || '—'}</td>
                      <td className="px-3 py-2 text-slate-500 line-through">{r.summary}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">
                        {new Date(r.deleted_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <button
                          onClick={() => handleRestore(r.id)}
                          disabled={busyId === r.id}
                          className="mr-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                          <RotateCcw size={12} /> 恢复
                        </button>
                        <button
                          onClick={() => handlePurge(r.id)}
                          disabled={busyId === r.id}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50"
                        >
                          <Trash2 size={12} /> 永久删除
                        </button>
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
