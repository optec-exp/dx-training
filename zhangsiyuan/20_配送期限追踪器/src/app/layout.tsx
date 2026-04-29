import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '配送期限トラッカー — ETD/ETA管理',
  description: 'Shipment delivery deadline tracker with ETD/ETA management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
