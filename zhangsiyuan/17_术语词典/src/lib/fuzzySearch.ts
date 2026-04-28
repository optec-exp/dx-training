export type Lang = 'zh' | 'en' | 'ja'

export interface Term {
  id: string
  abbr: string
  category: string
  fullName: { en: string; zh: string; ja: string }
  definition: { en: string; zh: string; ja: string }
  meta?: {
    transport?: 'any' | 'sea' | 'land'
    legacy?: boolean
    customsExport?: 'buyer' | 'seller'
    customsImport?: 'buyer' | 'seller'
    riskTransfer?: { zh: string; en: string }
  }
}

function normalize(s: string): string {
  return s.toLowerCase().trim()
}

function scoreMatch(query: string, target: string): number {
  const q = normalize(query)
  const t = normalize(target)
  if (!q || !t) return 0

  // Exact full match
  if (t === q) return 100
  // Starts with query
  if (t.startsWith(q)) return 90
  // Contains query as substring
  if (t.includes(q)) return 80

  // All words present
  const words = q.split(/\s+/).filter(Boolean)
  if (words.length > 1 && words.every(w => t.includes(w))) return 70

  // Fuzzy character-sequence match (subsequence)
  let qi = 0
  let consecutive = 0
  let score = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      qi++
      consecutive++
      score += consecutive
    } else {
      consecutive = 0
    }
  }
  if (qi === q.length) return Math.min(60, score)

  return 0
}

export function searchTerms(terms: Term[], query: string, lang: Lang): Term[] {
  const q = query.trim()
  if (!q) return terms

  const scored = terms.map(term => {
    const fields = [
      { text: term.abbr, weight: 3 },
      { text: term.fullName[lang], weight: 2 },
      { text: term.fullName.en, weight: 2 },
      { text: term.fullName.zh, weight: 2 },
      { text: term.definition[lang], weight: 1 },
    ]
    const best = Math.max(...fields.map(f => scoreMatch(q, f.text) * f.weight))
    return { term, score: best }
  })

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.term)
}
