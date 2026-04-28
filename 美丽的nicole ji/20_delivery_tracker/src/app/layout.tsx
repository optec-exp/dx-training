import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'OPTEC 配送期限追踪器', description: 'ETD / ETA 管理' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
