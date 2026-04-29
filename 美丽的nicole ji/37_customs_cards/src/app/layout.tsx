import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'OPTEC 通关知识卡', description: '进口通关知识学习卡 · 卡片翻转' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
