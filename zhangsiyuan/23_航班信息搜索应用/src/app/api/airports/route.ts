import { NextRequest, NextResponse } from 'next/server'
import { getAmadeusToken, AMADEUS_BASE } from '@/lib/amadeus'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json({ data: [] })

  if (!process.env.AMADEUS_CLIENT_ID) {
    return NextResponse.json({ error: 'AMADEUS_CLIENT_ID not configured' }, { status: 500 })
  }

  try {
    const token = await getAmadeusToken()
    const url = `${AMADEUS_BASE}/v1/reference-data/locations?subType=AIRPORT,CITY&keyword=${encodeURIComponent(q)}&page[limit]=8&view=LIGHT`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json() as { data?: unknown[] }
    return NextResponse.json({ data: data.data ?? [] })
  } catch (err) {
    console.error('[airports]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}
