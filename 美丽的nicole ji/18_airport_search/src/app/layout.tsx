import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OPTEC 机场代码搜索',
  description: '全球 500 个机场 IATA/ICAO 代码查询，附 Google Maps 地图',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
