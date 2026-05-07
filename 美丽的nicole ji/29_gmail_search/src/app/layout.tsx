import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Gmail 搜索应用',
  description: 'Gmail 搜索・显示应用',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* Providers で SessionProvider をラップ */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
