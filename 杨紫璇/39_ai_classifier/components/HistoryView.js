'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { confidenceColor, formatTime } from '@/lib/ui'

export default function HistoryView() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)

  async function loadRecords() {
    setLoading(true)
    const { data } = await supabase
      .from('classifications')
      .select('*')
      .order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadRecords()
  }, [])

  async function handleDelete(id) {
    if (!confirm('确定删除这条记录吗？')) return
    await supabase.from('classifications').delete().eq('id', id)
    setRecords((prev) => prev.filter((r) => r.id !== id))
  }

  if (loading) return <p className="text-gray-500">加载中…</p>
  if (records.length === 0) return <p className="text-gray-500">还没有任何分类记录。</p>

  return (
    <div className="space-y-3">
      {records.map((r) => {
        const percent = Math.round(r.confidence * 100)
        const color = confidenceColor(r.confidence)
        const expanded = expandedId === r.id
        return (
          <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : r.id)}
              >
                <p className={expanded ? 'text-gray-800' : 'text-gray-800 truncate'}>
                  {r.input_text}
                </p>
              </div>
              <span className="shrink-0 px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {r.category}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color.bar}`} style={{ width: `${percent}%` }} />
              </div>
              <span className={`text-xs font-semibold ${color.text}`}>{percent}%</span>
              <span className="text-xs text-gray-400">{formatTime(r.created_at)}</span>
              <button
                onClick={() => handleDelete(r.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                删除
              </button>
            </div>

            {expanded && (
              <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                理由：{r.reasoning}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
