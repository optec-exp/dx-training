'use client'
import { useRef } from 'react'
import type { Lang } from '@/lib/types'
import { UI } from '@/lib/translations'

interface Props {
  query: string
  lang: Lang
  onChange: (v: string) => void
}

export default function SearchBar({ query, lang, onChange }: Props) {
  const t = UI[lang]
  const ref = useRef<HTMLInputElement>(null)

  return (
    <div className="search-wrap">
      <span className="search-icon">🔍</span>
      <input
        ref={ref}
        className="search-input"
        type="text"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder={t.placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {query && (
        <button
          className="search-clear"
          onClick={() => { onChange(''); ref.current?.focus() }}
          aria-label={t.clear}
        >
          ✕
        </button>
      )}
    </div>
  )
}
