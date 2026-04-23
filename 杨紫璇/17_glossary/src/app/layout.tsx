import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OPTEC Express — 航空货运术语词典",
  description: "包含35条航空货运专业术语，支持日英中三语显示、分类过滤与即时搜索。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
