'use client'

import { useState } from 'react'
import { confidenceColor } from '@/lib/ui'

export default function ClassifyView() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClassify() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || '分类失败')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const percent = result ? Math.round(result.confidence * 100) : 0
  const color = result ? confidenceColor(result.confidence) : null

  return (
    <div>
      <textarea
        className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="输入要分类的文本，例如：货物到港后外箱破损，要求赔偿"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="mt-3 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        onClick={handleClassify}
        disabled={loading || !text.trim()}
      >
        {loading ? '分类中…' : '开始分类'}
      </button>

      {error && <p className="mt-4 text-red-600">出错了：{error}</p>}

      {result && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm text-gray-500">分类结果</span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {result.category}
            </span>
          </div>

          <div className="mb-5">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-500">置信度</span>
              <span className={`text-sm font-semibold ${color.text}`}>{percent}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color.bar} transition-all duration-500`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div>
            <span className="text-sm text-gray-500">判断理由</span>
            <p className="mt-1 text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3">
              {result.reasoning}
            </p>
          </div>

          <p className={`mt-4 text-sm ${result.saved ? 'text-green-600' : 'text-red-600'}`}>
            {result.saved ? '✓ 已保存到数据库' : '✗ 保存失败（结果未入库）'}
          </p>
        </div>
      )}
    </div>
  )
}
