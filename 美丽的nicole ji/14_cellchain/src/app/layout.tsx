import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CellChain Logistics — OPTEC Express 医药品冷链',
  description: 'CellChain by OPTEC Express：超低温运输、冷藏运输、GDP合规服务，专业医药品国际物流。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
