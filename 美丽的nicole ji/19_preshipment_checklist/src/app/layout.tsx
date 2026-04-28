import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'OPTEC 出货前确认清单', description: 'AWB / 通关 / 温度管理' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
