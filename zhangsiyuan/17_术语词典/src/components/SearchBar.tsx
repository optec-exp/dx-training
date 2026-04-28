'use client'

interface Props {
  value: string
  placeholder: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, placeholder, onChange }: Props) {
  return (
    <div className="search-wrap">
      <span className="search-icon">⌕</span>
      <input
        className="search-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          className="search-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  )
}
