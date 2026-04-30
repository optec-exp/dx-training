export const AMADEUS_BASE = 'https://test.api.amadeus.com'

// Module-level token cache (persists within the same server process)
let _token: string | null = null
let _expiry = 0

export async function getAmadeusToken(): Promise<string> {
  if (_token && Date.now() < _expiry) return _token

  const res = await fetch(`${AMADEUS_BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID ?? '',
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? '',
    }),
    cache: 'no-store',
  })

  if (!res.ok) throw new Error(`Amadeus auth failed: HTTP ${res.status}`)

  const data = await res.json() as { access_token: string; expires_in: number }
  _token = data.access_token
  _expiry = Date.now() + (data.expires_in - 60) * 1000  // 60s buffer
  return _token
}
