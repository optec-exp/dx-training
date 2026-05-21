'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createComment } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
    >
      {pending ? '发送中...' : '发送'}
    </button>
  )
}

export default function CommentForm({ postId }: { postId: number }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function action(formData: FormData) {
    setErrorMsg(null)
    const result = await createComment(postId, formData)
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      formRef.current?.reset()
    }
  }

  return (
    <form ref={formRef} action={action} className="mt-2 space-y-2">
      <div className="flex gap-2">
        <input
          name="content"
          type="text"
          placeholder="写下你的评论..."
          required
          className="flex-1 min-w-0 px-3 py-2 text-sm border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <SubmitButton />
      </div>
      {errorMsg && (
        <p className="text-xs text-red-600">发送失败：{errorMsg}</p>
      )}
    </form>
  )
}
