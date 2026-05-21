'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { deleteComment, deletePost, updatePost } from './actions'
import CommentForm from './CommentForm'

type Comment = {
  id: number
  created_at: string
  user_id: string
  content: string
}

type Post = {
  id: number
  created_at: string
  user_id: string
  title: string
  content: string
  comments: Comment[]
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

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-700 disabled:opacity-50"
    >
      {pending ? '保存中...' : '保存'}
    </button>
  )
}

export default function PostCard({
  post,
  currentUserId,
}: {
  post: Post
  currentUserId: string | null
}) {
  const isLoggedIn = currentUserId !== null
  const isMine = post.user_id === currentUserId

  async function handleDeleteComment(commentId: number, snippet: string) {
    if (!confirm(`确定要删除评论「${snippet}」吗？`)) return
    const result = await deleteComment(commentId)
    if (result.error) {
      alert(`删除失败：${result.error}`)
    }
  }

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function action(formData: FormData) {
    setErrorMsg(null)
    const result = await updatePost(post.id, formData)
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setIsEditing(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`确定要删除「${post.title}」吗？此操作不可撤销。`)) {
      return
    }
    setIsDeleting(true)
    setErrorMsg(null)
    const result = await deletePost(post.id)
    if (result.error) {
      setErrorMsg(result.error)
      setIsDeleting(false)
    }
    // 成功时不重置 isDeleting，因为这条卡片即将被服务器移除
  }

  if (isEditing) {
    return (
      <li className="p-5 bg-white border border-zinc-300 rounded-lg shadow-sm">
        <form action={action} className="space-y-3">
          <input
            name="title"
            type="text"
            defaultValue={post.title}
            required
            className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <textarea
            name="content"
            rows={4}
            defaultValue={post.content}
            required
            className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
          />
          {errorMsg && (
            <p className="text-sm text-red-600">保存失败：{errorMsg}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null)
                setIsEditing(false)
              }}
              className="px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-50"
            >
              取消
            </button>
            <SaveButton />
          </div>
        </form>
      </li>
    )
  }

  return (
    <li
      className={`p-5 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md transition-all ${
        isDeleting ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-lg font-semibold text-zinc-900">{post.title}</h2>
        {isMine && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-zinc-500 hover:text-zinc-900"
            >
              编辑
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              {isDeleting ? '删除中...' : '删除'}
            </button>
          </div>
        )}
      </div>
      <p className="text-zinc-700 whitespace-pre-wrap mb-3">{post.content}</p>
      {errorMsg && (
        <p className="text-sm text-red-600 mb-2">操作失败：{errorMsg}</p>
      )}
      <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
        <span>作者 {post.user_id.slice(0, 8)}</span>
        <span>·</span>
        <span>{formatDate(post.created_at)}</span>
      </div>

      <section className="pt-3 border-t border-zinc-100">
        <h3 className="text-xs font-medium text-zinc-500 mb-2">
          评论 ({post.comments.length})
        </h3>
        {post.comments.length === 0 ? (
          <p className="text-sm text-zinc-400">暂无评论</p>
        ) : (
          <ul className="space-y-2">
            {post.comments.map((c) => {
              const isMyComment = c.user_id === currentUserId
              return (
                <li key={c.id} className="p-3 bg-zinc-50 rounded text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-zinc-700 whitespace-pre-wrap flex-1 min-w-0">
                      {c.content}
                    </p>
                    {isMyComment && (
                      <button
                        onClick={() =>
                          handleDeleteComment(c.id, c.content.slice(0, 20))
                        }
                        className="text-xs text-red-500 hover:text-red-700 shrink-0"
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                    <span>{c.user_id.slice(0, 8)}</span>
                    <span>·</span>
                    <span>{formatDate(c.created_at)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {isLoggedIn ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="mt-2 text-xs text-zinc-400">请登录后评论</p>
        )}
      </section>
    </li>
  )
}
