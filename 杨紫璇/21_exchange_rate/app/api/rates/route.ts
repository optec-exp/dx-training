import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.EXCHANGERATE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key not configured. Please set EXCHANGERATE_API_KEY in .env.local' },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://v6.exchangerate-api.com/v6/${apiKey}/latest/JPY`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Failed to fetch rates (HTTP ${res.status})` },
      { status: 502 }
    );
  }

  const data = await res.json();

  if (data.result !== 'success') {
    return NextResponse.json(
      { error: data['error-type'] || 'API returned an error' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    rates: {
      USD: data.conversion_rates.USD,
      EUR: data.conversion_rates.EUR,
      CNY: data.conversion_rates.CNY,
    },
    lastUpdate: data.time_last_update_utc,
  });
}
