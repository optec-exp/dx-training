import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OPTEC Express — Air Cargo China 2026',
  description: 'OPTEC Express 出展 Air Cargo China 2026 / Exhibiting at Air Cargo China 2026 / 参加2026年中国国际航空货运大会',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
