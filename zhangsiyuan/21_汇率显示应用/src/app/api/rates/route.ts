import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date') ?? ''
  const today = new Date().toISOString().split('T')[0]
  const isLatest = !date || date >= today

  const APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID
  if (!APP_ID) {
    return NextResponse.json(
      { error: 'API key not configured. Set OPEN_EXCHANGE_RATES_APP_ID in .env.local' },
      { status: 500 }
    )
  }

  const url = isLatest
    ? `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`
    : `https://openexchangerates.org/api/historical/${date}.json?app_id=${APP_ID}`

  try {
    const res = await fetch(url, {
      next: { revalidate: isLatest ? 3600 : 60 * 60 * 24 * 30 },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as { description?: string }).description ?? `HTTP ${res.status}` },
        { status: res.status }
      )
    }
    const data = await res.json() as { rates: Record<string, number>; base: string; timestamp: number; date?: string }
    return NextResponse.json({
      rates: data.rates,
      base: data.base,
      date: data.date ?? new Date(data.timestamp * 1000).toISOString().split('T')[0],
    })
  } catch {
    return NextResponse.json({ error: 'Network error — failed to fetch exchange rates' }, { status: 500 })
  }
}
