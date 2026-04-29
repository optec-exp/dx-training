import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '会议议程模板生成器 | OPTEC',
  description: 'OPTEC 财务部门会议议程模板生成器，支持中日英三语',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
