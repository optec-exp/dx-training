import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'OPTEC 运费快速估算器', description: '空运·OBC·体积重计算·附加费合计' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
