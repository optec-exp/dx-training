import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nicole Ji — 马拉松综合展示',
  description: 'OPTEC Express DX室 · 60天AI编程训练营 · 作品01-20',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
