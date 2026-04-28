import type { Airport } from './types'

function score(field: string, q: string): number {
  const f = field.toLowerCase()
  const query = q.toLowerCase()
  if (f === query) return 100
  if (f.startsWith(query)) return 90
  if (f.includes(query)) return 80
  const words = query.split(/\s+/)
  if (words.length > 1 && words.every(w => f.includes(w))) return 70
  let i = 0
  for (const ch of f) {
    if (ch === query[i]) i++
    if (i === query.length) return 55
  }
  return 0
}

export function searchAirports(airports: Airport[], query: string): Airport[] {
  const q = query.trim()
  if (!q) return airports

  type Scored = { airport: Airport; s: number }
  const results: Scored[] = []

  for (const a of airports) {
    const s = Math.max(
      score(a.iata, q) * 3,
      score(a.icao, q) * 3,
      score(a.name, q) * 2,
      score(a.city, q) * 2,
      score(a.country, q)
    )
    if (s > 0) results.push({ airport: a, s })
  }

  results.sort((a, b) => b.s - a.s)
  return results.map(r => r.airport)
}
