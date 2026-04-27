import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OPTEC 物流术语词典',
  description: '航空货运专业术语查询——日英中三语、分类过滤、即时搜索',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
