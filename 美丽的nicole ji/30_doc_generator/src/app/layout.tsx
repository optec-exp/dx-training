import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '案件確認書 自動生成' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
