import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = { title: 'Timezone Converter', description: 'Air freight timezone tool' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
