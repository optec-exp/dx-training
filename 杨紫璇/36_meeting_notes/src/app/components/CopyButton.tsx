'use client'

import { useState } from 'react'

export default function CopyButton({
  text,
  label = '复制',
}: {
  text: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      // 2 秒后还原文案
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 老浏览器或非 HTTPS 环境下 clipboard API 不可用,降级到 prompt
      window.prompt('请手动复制以下内容:', text)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 text-xs border border-zinc-300 rounded hover:bg-zinc-100 transition-colors"
    >
      {copied ? '✓ 已复制' : label}
    </button>
  )
}
