import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Volume Weight Calculator · 体积重量计算工具',
  description: 'Freight forwarder tool: volumetric weight vs actual weight, multi-SKU, real-time',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
