import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Flight Search',
  description: 'Search flights with layover options',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh"><body>{children}</body></html>
}
