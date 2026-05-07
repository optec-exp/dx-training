import { NextResponse } from 'next/server'

const BASE_CURRENCIES = ['USD', 'EUR', 'CNY', 'JPY', 'HKD']

export async function GET() {
  const apiKey = process.env.FREECURRENCY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const currencies = BASE_CURRENCIES.join(',')
  const url = `https://api.freecurrencyapi.com/v1/latest?apikey=${apiKey}&currencies=${currencies}&base_currency=USD`

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 502 })
  }

  const json = await res.json()
  return NextResponse.json(json.data)
}
