import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Freight News Reader', description: 'Air freight industry news' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
