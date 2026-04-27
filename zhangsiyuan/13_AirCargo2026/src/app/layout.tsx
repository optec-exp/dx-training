import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Air Cargo China 2026',
  description: 'Transport Logistic China 2026 — Asia\'s premier air cargo & logistics exhibition, Shanghai, June 24–26',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
