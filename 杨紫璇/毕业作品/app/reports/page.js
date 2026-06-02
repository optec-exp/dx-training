'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Spinner, EmptyState } from '@/lib/ui'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openId, setOpenId] = useState(null)

  const [selectedIds, setSelectedIds] = useState([])
  const [comparing, setComparing] = useState(false)
  const [compareResult, setCompareResult] = useState('')
  const [compareError, setCompareError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('analysis_reports')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      else setReports(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function toggleSelect(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleCompare() {
    setComparing(true)
    setCompareError(null)
    setCompareResult('')
    try {
      const picked = selectedIds.map((id) => reports.find((r) => r.id === id))
      const sorted = [...picked].sort((x, y) => new Date(x.created_at) - new Date(y.created_at))
      const pick = (r) => ({
        title: r.title,
        statsText: r.data_snapshot?.statsText,
        analysis_result: r.analysis_result,
      })
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: sorted.map(pick) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '对比失败')
      setCompareResult(data.result)
    } catch (err) {
      setCompareError(err.message)
    } finally {
      setComparing(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">历史分析报告</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
          </Link>
        </div>

        {loading && <div className="flex items-center gap-2 text-sm text-slate-500"><Spinner /> 加载中…</div>}
        {error && <div className="rounded bg-red-50 p-4 text-red-700">读取出错:{error}</div>}

        {!loading && !error && reports.length === 0 && (
          <EmptyState icon={FileText} title="还没有保存的报告" hint="去看板做 AI 分析后点「保存报告」,这里就会出现。" />
        )}

        {!loading && !error && reports.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span className="text-sm text-slate-600">勾选两份或更多报告进行 AI 对比(已选 {selectedIds.length})</span>
            <button
              onClick={handleCompare}
              disabled={selectedIds.length < 2 || comparing}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {comparing ? '对比中…' : 'AI 对比所选'}
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => {
                  setSelectedIds([])
                  setCompareResult('')
                  setCompareError(null)
                }}
                className="text-sm text-slate-500 hover:underline"
              >
                清除选择
              </button>
            )}
          </div>
        )}

        {compareError && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">对比出错:{compareError}</div>
        )}
        {comparing && (
          <p className="mb-4 text-sm text-slate-500">AI 正在对比两期报告,请稍候…</p>
        )}
        {compareResult && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">AI 两期对比</h2>
            <article className="prose prose-sm max-w-none">
              <ReactMarkdown>{compareResult}</ReactMarkdown>
            </article>
          </div>
        )}

        <div className="space-y-3">
          {reports.map((r) => {
            const checked = selectedIds.includes(r.id)
            return (
              <div key={r.id} className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 p-4">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(r.id)}
                    className="h-4 w-4"
                  />
                  <button
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                    className="flex flex-1 items-center justify-between text-left"
                  >
                    <span className="font-medium">{r.title}</span>
                    <span className="text-sm text-slate-400">
                      {new Date(r.created_at).toLocaleString('zh-CN')} {openId === r.id ? '▼' : '▶'}
                    </span>
                  </button>
                </div>
                {openId === r.id && (
                  <div className="border-t border-slate-100 p-4">
                    <article className="prose prose-sm max-w-none">
                      <ReactMarkdown>{r.analysis_result}</ReactMarkdown>
                    </article>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
