'use client'
// useState 示例：搜索框管理 query 文字和下拉开关状态
import { useState, useRef, useEffect } from 'react'
import { searchAirports, type Airport, type Lang } from '@/data/airports'

type Props = {
  value: Airport | null
  onChange: (a: Airport | null) => void
  placeholder: string
  lang: Lang
  id?: string
}

export default function AirportSearch({ value, onChange, placeholder, lang, id }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const results = searchAirports(query, lang)

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  if (value) {
    return (
      <div className="airport-selected">
        <span className="as-code">{value.code}</span>
        <span className="as-name">
          {value.city[lang] || value.city.en}
          <span className="as-fullname">{value.name[lang] || value.name.en}</span>
        </span>
        <button className="as-clear" onClick={() => onChange(null)} aria-label="clear">✕</button>
      </div>
    )
  }

  return (
    <div className="airport-wrap" ref={wrapRef}>
      <input
        id={id}
        type="text"
        className="airport-input"
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <ul className="airport-dropdown">
          {results.map(a => (
            <li
              key={a.code}
              className="airport-option"
              onMouseDown={() => { onChange(a); setQuery(''); setOpen(false) }}
            >
              <span className="opt-code">{a.code}</span>
              <span className="opt-info">
                <span className="opt-city">{a.city[lang] || a.city.en}</span>
                <span className="opt-country">{a.countryName[lang] || a.countryName.en}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
