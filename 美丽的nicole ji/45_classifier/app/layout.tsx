import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 数据分类工具",
  description: "输入文本，AI自动分类并给出置信度评分",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
