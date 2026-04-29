import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.freecurrencyapi.com/v1'
const API_KEY = process.env.FREECURRENCY_API_KEY ?? ''

export async function GET(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'FREECURRENCY_API_KEY not configured — add it to .env.local' },
      { status: 500 }
    )
  }

  const date = req.nextUrl.searchParams.get('date') ?? ''
  const today = new Date().toISOString().split('T')[0]
  const isLatest = !date || date >= today

  try {
    if (isLatest) {
      const res = await fetch(
        `${BASE}/latest?apikey=${API_KEY}&base_currency=USD`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) {
        return NextResponse.json(
          { error: `FreeCurrencyAPI error: HTTP ${res.status}` },
          { status: res.status }
        )
      }
      const data = await res.json() as {
        meta: { last_updated_at: string }
        data: Record<string, number>
      }
      // FreeCurrencyAPI omits base currency from response — add it manually
      const rates: Record<string, number> = { ...data.data, USD: 1.0 }
      const rateDate = data.meta.last_updated_at.split('T')[0]
      return NextResponse.json({ rates, base: 'USD', date: rateDate })
    } else {
      const res = await fetch(
        `${BASE}/historical?apikey=${API_KEY}&date=${date}&base_currency=USD`,
        { next: { revalidate: 60 * 60 * 24 * 30 } }
      )
      if (!res.ok) {
        return NextResponse.json(
          { error: `FreeCurrencyAPI error: HTTP ${res.status}` },
          { status: res.status }
        )
      }
      const data = await res.json() as {
        data: Record<string, Record<string, number>>
      }
      const dateRates = data.data[date]
      if (!dateRates) {
        return NextResponse.json(
          { error: `No data available for ${date}` },
          { status: 404 }
        )
      }
      const rates: Record<string, number> = { ...dateRates, USD: 1.0 }
      return NextResponse.json({ rates, base: 'USD', date })
    }
  } catch {
    return NextResponse.json(
      { error: 'Network error — failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}
