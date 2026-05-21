'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { signIn } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? '登录中...' : '登录'}
    </button>
  )
}

export default function LoginForm() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function action(formData: FormData) {
    setErrorMsg(null)
    const result = await signIn(formData)
    // 成功时 server action 内部 redirect，这里只处理失败
    if (result?.error) {
      setErrorMsg(result.error)
    }
  }

  return (
    <form
      action={action}
      className="p-6 bg-white border border-zinc-200 rounded-lg space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          邮箱
        </label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="test-a@example.com"
          className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">
          密码
        </label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-zinc-300 rounded focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {errorMsg && (
        <p className="text-sm text-red-600">登录失败：{errorMsg}</p>
      )}

      <SubmitButton />
    </form>
  )
}
