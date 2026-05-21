'use client'

import { useState } from 'react'
import { signOut } from './login/actions'

export default function LogoutButton() {
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    setIsPending(true)
    await signOut()
    // signOut 内部 redirect，这里不会执行到 setIsPending(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="px-3 py-1.5 text-sm border border-zinc-300 rounded hover:bg-zinc-50 disabled:opacity-50"
    >
      {isPending ? '登出中...' : '登出'}
    </button>
  )
}
