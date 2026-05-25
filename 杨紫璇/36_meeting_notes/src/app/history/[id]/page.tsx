import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import CopyButton from '@/app/components/CopyButton'
import DeleteButton from './DeleteButton'

type ActionItem = { owner: string; task: string; due: string }

// 把详情整合成 Markdown 文本,便于一键复制
function noteToMarkdown(note: {
  title: string
  summary: string
  action_items: ActionItem[]
}): string {
  const lines = [
    `# ${note.title}`,
    '',
    '## 📝 摘要',
    '',
    note.summary,
    '',
    '## ✅ 行动项',
    '',
  ]
  for (const item of note.action_items) {
    lines.push(`- **${item.owner}**:${item.task}(截止:${item.due})`)
  }
  return lines.join('\n')
}

type NoteDetail = {
  id: number
  title: string
  source_text: string
  summary: string
  action_items: { owner: string; task: string; due: string }[]
  created_at: string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function NoteDetailPage({
  params,
}: {
  // Next.js 16: params 是 Promise,需要 await
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const numericId = Number(id)

  if (!Number.isFinite(numericId)) {
    notFound()
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('id', numericId)
    .single()

  if (error || !data) {
    notFound()
  }

  const note = data as NoteDetail

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <main className="max-w-3xl mx-auto">
        <header className="mb-6 flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-zinc-900 break-words">
              {note.title}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {formatDate(note.created_at)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Link
              href="/history"
              className="px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-100"
            >
              ← 返回列表
            </Link>
            <DeleteButton id={note.id} title={note.title} />
          </div>
        </header>

        <div className="space-y-4">
          <section className="p-5 bg-white border border-zinc-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-zinc-900">📝 摘要</h2>
              <CopyButton text={note.summary} label="复制摘要" />
            </div>
            <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
              {note.summary}
            </p>
          </section>

          <section className="p-5 bg-white border border-zinc-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-zinc-900">
                ✅ 行动项 ({note.action_items.length})
              </h2>
              <CopyButton
                text={noteToMarkdown(note)}
                label="复制全部 (Markdown)"
              />
            </div>
            {note.action_items.length === 0 ? (
              <p className="text-sm text-zinc-400">本次会议无行动项</p>
            ) : (
              <ul className="space-y-3">
                {note.action_items.map((item, idx) => (
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

          <details className="p-5 bg-white border border-zinc-200 rounded-lg">
            <summary className="text-sm font-medium text-zinc-700 cursor-pointer">
              📄 原始会议记录(点击展开)
            </summary>
            <pre className="mt-3 text-sm text-zinc-600 whitespace-pre-wrap font-sans">
              {note.source_text}
            </pre>
          </details>
        </div>
      </main>
    </div>
  )
}
