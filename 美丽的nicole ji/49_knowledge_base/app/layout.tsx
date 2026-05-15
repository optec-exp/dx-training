import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "公司内部知识库",
  description: "发帖 → AI 摘要 → 标签分类 → 全文搜索",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
