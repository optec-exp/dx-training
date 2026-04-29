import { NextRequest, NextResponse } from 'next/server'

const BASE = process.env.EXCHANGE_API_BASE ?? 'https://api.frankfurter.app'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? ''
  const today = new Date().toISOString().split('T')[0]
  const isLatest = !date || date >= today

  const endpoint = isLatest ? `${BASE}/latest` : `${BASE}/${date}`

  try {
    const res = await fetch(endpoint, {
      next: { revalidate: isLatest ? 3600 : 60 * 60 * 24 * 30 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: `Frankfurter API error: HTTP ${res.status}` },
        { status: res.status }
      )
    }
    const data = await res.json() as {
      base: string
      date: string
      rates: Record<string, number>
    }
    // Add base currency itself (frankfurter omits it from the rates object)
    const rates: Record<string, number> = { ...data.rates, [data.base]: 1.0 }
    return NextResponse.json({ rates, base: data.base, date: data.date })
  } catch {
    return NextResponse.json({ error: 'Network error — failed to fetch exchange rates' }, { status: 500 })
  }
}
