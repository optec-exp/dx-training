import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'OPTEC 会议记录', description: '会议记录生成工具 · 三语 · 行动事项' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
