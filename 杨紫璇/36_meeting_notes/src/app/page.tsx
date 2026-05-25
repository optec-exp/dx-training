'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { SummaryResult } from './api/summarize/route'
import { saveNote } from './actions'
import { estimateTokens, humanizeError } from '@/utils/helpers'
import CopyButton from './components/CopyButton'

// 把 result 整合成纯文本,方便一键复制
function resultToMarkdown(result: SummaryResult): string {
  const lines = ['## 📝 摘要', '', result.summary, '', '## ✅ 行动项', '']
  for (const item of result.action_items) {
    lines.push(`- **${item.owner}**:${item.task}(截止:${item.due})`)
  }
  return lines.join('\n')
}

export default function Home() {
  const [text, setText] = useState('')
  const [title, setTitle] = useState('')

  const [streaming, setStreaming] = useState('')
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Token 估算(每次 text 变化时重算)
  const tokenEstimate = useMemo(() => estimateTokens(text), [text])

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    setResult(null)
    setStreaming('')
    setSavedId(null)
    setSaveError(null)
    setElapsed(0)

    // 计时器
    const startTime = Date.now()
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 200)

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(humanizeError(data.error || `请求失败 (${res.status})`))
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        accumulated += chunk
        setStreaming(accumulated)
      }

      try {
        const parsed = JSON.parse(accumulated) as SummaryResult
        setResult(parsed)
        setStreaming('')
      } catch (parseError) {
        setError(`JSON 解析失败:${(parseError as Error).message}`)
      }
    } catch (e) {
      setError(humanizeError(e instanceof Error ? e.message : '网络错误'))
    } finally {
      clearInterval(timer)
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!result) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await saveNote({
        title,
        source_text: text,
        summary: result.summary,
        action_items: result.action_items,
      })
      if (!res.ok) {
        setSaveError(humanizeError(res.error))
      } else {
        setSavedId(res.id)
      }
    } catch (e) {
      setSaveError(humanizeError(e instanceof Error ? e.message : '保存失败'))
    } finally {
      setSaving(false)
    }
  }

  function handleClear() {
    if (
      text &&
      !confirm('确定清空所有内容?当前结果(如已生成)也会丢失。')
    ) {
      return
    }
    setText('')
    setTitle('')
    setResult(null)
    setStreaming('')
    setError(null)
    setSavedId(null)
    setSaveError(null)
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <main className="max-w-3xl mx-auto">
        <header className="mb-6 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              AI 会议纪要摘要工具
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              粘贴会议记录,Gemini 流式生成摘要和行动项
            </p>
          </div>
          <Link
            href="/history"
            className="shrink-0 px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-100"
          >
            历史记录 →
          </Link>
        </header>

        <section className="mb-4">
          <label
            htmlFor="text"
            className="block text-sm font-medium text-zinc-700 mb-2"
          >
            会议记录
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="把会议记录粘贴到这里..."
            rows={10}
            className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-y"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-400">
            <span>预估 ~{tokenEstimate} tokens(实际由 Gemini 分词器决定)</span>
            <span>{text.length} 字符</span>
          </div>
        </section>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? `生成中... (${elapsed}s)` : '生成摘要'}
          </button>
          {(text || result) && !loading && (
            <button
              onClick={handleClear}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded hover:bg-zinc-100"
            >
              清空
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>失败:</strong> {error}
          </div>
        )}

        {streaming && !result && (
          <section className="mt-6 p-5 bg-zinc-900 text-zinc-100 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <h2 className="text-sm font-medium text-zinc-300">
                  正在接收(原始流)
                </h2>
              </div>
              <span className="text-xs text-zinc-500">{streaming.length} 字符</span>
            </div>
            <pre className="text-xs text-zinc-100 whitespace-pre-wrap font-mono break-all">
              {streaming}
              <span className="inline-block w-2 h-4 bg-zinc-100 animate-pulse ml-0.5" />
            </pre>
          </section>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <section className="p-5 bg-white border border-zinc-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-zinc-900">
                  📝 摘要
                </h2>
                <CopyButton text={result.summary} label="复制摘要" />
              </div>
              <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                {result.summary}
              </p>
            </section>

            <section className="p-5 bg-white border border-zinc-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-zinc-900">
                  ✅ 行动项 ({result.action_items.length})
                </h2>
                <CopyButton
                  text={resultToMarkdown(result)}
                  label="复制全部 (Markdown)"
                />
              </div>
              {result.action_items.length === 0 ? (
                <p className="text-sm text-zinc-400">本次会议无行动项</p>
              ) : (
                <ul className="space-y-3">
                  {result.action_items.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-zinc-50 rounded border border-zinc-200"
                    >
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {item.owner}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-800">{item.task}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            截止: {item.due}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="p-5 bg-white border border-zinc-200 rounded-lg">
              <h2 className="text-lg font-semibold text-zinc-900 mb-3">
                💾 保存到历史
              </h2>

              {savedId ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✅ 已保存!{' '}
                  <Link
                    href={`/history/${savedId}`}
                    className="font-medium underline hover:text-green-900"
                  >
                    查看详情
                  </Link>
                  {' · '}
                  <Link
                    href="/history"
                    className="font-medium underline hover:text-green-900"
                  >
                    查看历史列表
                  </Link>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="给这次会议起个名字(留空自动生成)"
                    className="w-full px-3 py-2 mb-3 border border-zinc-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? '保存中...' : '保存'}
                  </button>
                  {saveError && (
                    <p className="mt-2 text-sm text-red-600">
                      保存失败: {saveError}
                    </p>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
