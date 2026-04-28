import type { Metadata } from 'next'
import { LangProvider } from '@/context/LangContext'
import Nav from '@/components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'CellChain Logistics',
  description: 'Specialized international logistics for cell and regenerative medicine transport. Ultra-low temperature, precision cold chain, and regulatory support.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning>
        <LangProvider>
          <Nav />
          <main>{children}</main>
        </LangProvider>
      </body>
    </html>
  )
}
