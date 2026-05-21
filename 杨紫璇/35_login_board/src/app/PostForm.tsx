'use client'

import { useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { createPost } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? '发布中...' : '发布'}
    </button>
  )
}

export default function PostForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function action(formData: FormData) {
    setErrorMsg(null)
    const result = await createPost(formData)
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      formRef.current?.reset()
    }
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="mb-8 p-5 bg-white border border-zinc-200 rounded-lg space-y-3"
    >
      <h2 className="text-lg font-semibold text-zinc-900">发布新帖</h2>

      <input
        name="title"
        type="text"
        placeholder="标题"
        required
        className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400"
      />

      <textarea
        name="content"
        placeholder="正文"
        rows={4}
        required
        className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
      />

      {errorMsg && (
        <p className="text-sm text-red-600">发布失败：{errorMsg}</p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  )
}
