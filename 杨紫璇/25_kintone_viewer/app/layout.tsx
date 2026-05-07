import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kintone 案件列表查看器 | OPTEC",
  description: "Kintone 案件数据读取 · 状态过滤 · 关键词搜索",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
