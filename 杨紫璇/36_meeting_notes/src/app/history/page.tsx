import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type NoteListItem = {
  id: number
  title: string
  summary: string
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

export default async function HistoryPage() {
  const supabase = createClient()

  // 只读取列表所需字段(不读 source_text 和 action_items 节省流量)
  const { data, error } = await supabase
    .from('meeting_notes')
    .select('id, title, summary, created_at')
    .order('created_at', { ascending: false })

  const notes = data as NoteListItem[] | null

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <main className="max-w-3xl mx-auto">
        <header className="mb-6 flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">历史记录</h1>
            <p className="text-sm text-zinc-500 mt-1">
              共 {notes?.length ?? 0} 条记录
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-100"
          >
            ← 返回生成页
          </Link>
        </header>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            读取失败:{error.message}
          </div>
        )}

        {!error && notes && notes.length === 0 && (
          <div className="p-8 bg-white border border-zinc-200 rounded-lg text-center text-zinc-500">
            还没有保存的会议纪要。
            <Link
              href="/"
              className="ml-2 text-blue-600 hover:underline"
            >
              去生成一条
            </Link>
          </div>
        )}

        <ul className="space-y-3">
          {notes?.map((note) => (
            <li key={note.id}>
              <Link
                href={`/history/${note.id}`}
                className="block p-4 bg-white border border-zinc-200 rounded-lg hover:border-zinc-400 hover:shadow-sm transition-all"
              >
                <h2 className="text-lg font-semibold text-zinc-900 mb-1">
                  {note.title}
                </h2>
                <p className="text-sm text-zinc-600 line-clamp-2 mb-2">
                  {note.summary}
                </p>
                <span className="text-xs text-zinc-400">
                  {formatDate(note.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
