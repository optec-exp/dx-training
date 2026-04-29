import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Cargo Tracker', description: 'Air freight cargo tracking' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
