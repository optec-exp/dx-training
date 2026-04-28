import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '月次決算チェックリスト',
  description: 'Monthly settlement checklist with progress tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
