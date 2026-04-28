'use client'
import { useState, useEffect, useCallback } from 'react'
import termsData from '@/data/terms.json'
import type { Term, Lang } from '@/lib/fuzzySearch'
import { searchTerms } from '@/lib/fuzzySearch'
import { CATEGORIES, UI } from '@/lib/translations'
import Header from '@/components/Header'
import SearchBar from '@/components/SearchBar'
import CategoryFilter from '@/components/CategoryFilter'
import TermCard from '@/components/TermCard'
import TermModal from '@/components/TermModal'

const ALL_TERMS: Term[] = termsData as Term[]

function buildCounts(terms: Term[]): Record<string, number> {
  const counts: Record<string, number> = { __total__: terms.length }
  for (const t of terms) {
    counts[t.category] = (counts[t.category] ?? 0) + 1
  }
  return counts
}

export default function Home() {
  const [lang, setLang] = useState<Lang>('zh')
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [filteredTerms, setFilteredTerms] = useState<Term[]>(ALL_TERMS)
  const [activeTerm, setActiveTerm] = useState<Term | null>(null)

  // Core useEffect: re-filter whenever query, category, or language changes
  useEffect(() => {
    let result = ALL_TERMS

    if (selectedCategory !== 'all') {
      result = result.filter(t => t.category === selectedCategory)
    }

    if (query.trim()) {
      result = searchTerms(result, query, lang)
    }

    setFilteredTerms(result)
  }, [query, selectedCategory, lang])

  const allCounts = buildCounts(ALL_TERMS)
  const filteredCounts = buildCounts(
    query.trim() ? searchTerms(ALL_TERMS, query, lang) : ALL_TERMS
  )

  const t = UI[lang]

  const handleCategorySelect = useCallback((id: string) => {
    setSelectedCategory(id)
  }, [])

  return (
    <div className="page-wrapper">
      <Header lang={lang} onLangChange={setLang} />

      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">{t.appTitle}</h1>
        <p className="hero-subtitle">{t.appSubtitle}</p>
      </section>

      {/* Sticky controls */}
      <div className="controls">
        <SearchBar
          value={query}
          placeholder={t.searchPlaceholder}
          onChange={setQuery}
        />
        <CategoryFilter
          selected={selectedCategory}
          lang={lang}
          counts={filteredCounts}
          onSelect={handleCategorySelect}
        />
      </div>

      {/* Results */}
      <main className="main-content">
        <p className="results-meta">{t.termsCount(filteredTerms.length)}</p>

        {filteredTerms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">{t.noResults}</div>
            <div className="empty-hint">{t.noResultsHint}</div>
          </div>
        ) : (
          <div className="term-grid">
            {filteredTerms.map(term => (
              <TermCard
                key={term.id}
                term={term}
                lang={lang}
                onClick={() => setActiveTerm(term)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {activeTerm && (
        <TermModal
          term={activeTerm}
          lang={lang}
          onClose={() => setActiveTerm(null)}
        />
      )}
    </div>
  )
}
