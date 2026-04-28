import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { LanguageProvider } from '@/context/LanguageContext'

export const metadata: Metadata = {
  title: 'OPTEC Express — Official Website',
  description: '東京を拠点に、96カ国・地域をつなぐ国際総合物流企業',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body suppressHydrationWarning>
        <LanguageProvider>
          <Nav />
          <main>{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  )
}
