import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Weather Dashboard',
  description: 'Live weather forecast for Tokyo, Shanghai and Yantai',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh"><body>{children}</body></html>
}
