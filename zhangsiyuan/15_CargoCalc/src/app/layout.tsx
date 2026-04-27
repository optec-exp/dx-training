import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'

export const metadata: Metadata = {
  title: 'Air Cargo Cost Simulator',
  description: 'Estimate air freight costs by route, weight, and service type. For freight forwarders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
