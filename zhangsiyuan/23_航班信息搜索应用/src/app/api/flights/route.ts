import { NextRequest, NextResponse } from 'next/server'
import { getAmadeusToken, AMADEUS_BASE } from '@/lib/amadeus'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const origin      = p.get('origin') ?? ''
  const destination = p.get('destination') ?? ''
  const date        = p.get('date') ?? ''
  const returnDate  = p.get('returnDate') ?? ''
  const adults      = p.get('adults') ?? '1'
  const nonStop     = p.get('nonStop') ?? 'false'

  if (!origin || !destination || !date) {
    return NextResponse.json({ error: 'Missing required params: origin, destination, date' }, { status: 400 })
  }
  if (!process.env.AMADEUS_CLIENT_ID) {
    return NextResponse.json({ error: 'AMADEUS_CLIENT_ID not configured — add credentials to .env.local' }, { status: 500 })
  }

  try {
    const token = await getAmadeusToken()

    const url = new URL(`${AMADEUS_BASE}/v2/shopping/flight-offers`)
    url.searchParams.set('originLocationCode', origin)
    url.searchParams.set('destinationLocationCode', destination)
    url.searchParams.set('departureDate', date)
    url.searchParams.set('adults', adults)
    url.searchParams.set('nonStop', nonStop)
    url.searchParams.set('max', '20')
    url.searchParams.set('currencyCode', 'USD')
    if (returnDate) url.searchParams.set('returnDate', returnDate)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({})) as { errors?: { detail?: string }[] }
      const detail = errBody.errors?.[0]?.detail ?? `HTTP ${res.status}`
      return NextResponse.json({ error: detail }, { status: res.status })
    }

    const data = await res.json() as {
      data: unknown[]
      dictionaries: unknown
      meta: unknown
    }

    return NextResponse.json({
      flights: data.data ?? [],
      dictionaries: data.dictionaries ?? {},
      meta: data.meta ?? {},
    })
  } catch (err) {
    console.error('[flights]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch flights' },
      { status: 500 }
    )
  }
}
