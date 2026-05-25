'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteNote } from '@/app/actions'

export default function DeleteButton({
  id,
  title,
}: {
  id: number
  title: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(`确定删除「${title}」吗?此操作不可撤销。`)) return

    setDeleting(true)
    setError(null)

    const result = await deleteNote(id)
    if (!result.ok) {
      setError(result.error)
      setDeleting(false)
      return
    }

    // 删除成功 -> 回历史列表
    router.push('/history')
    router.refresh() // 让列表 Server Component 重新拉数据
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 disabled:opacity-50"
      >
        {deleting ? '删除中...' : '删除'}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600">删除失败: {error}</p>
      )}
    </div>
  )
}
