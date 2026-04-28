import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'OPTEC Express 新人入职指南', description: '入职流程·公司架构·快速联系' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
