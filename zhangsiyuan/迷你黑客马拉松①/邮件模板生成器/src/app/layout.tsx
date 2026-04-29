import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Email Template Generator', description: 'Air freight email templates' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
