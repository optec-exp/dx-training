import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OPTEC 航空货运术语词典',
  description: '航空货运专业术语中英日三语词典',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  )
}
