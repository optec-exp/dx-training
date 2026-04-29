import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '截货时间倒计时 | OPTEC',
  description: 'OPTEC 运营/财务 — 各班次截货时间追踪工具',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
