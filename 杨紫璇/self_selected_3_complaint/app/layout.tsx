import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "客户投诉分类分析 | OPTEC",
  description: "投诉件数 × 类型可视化分析工具",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
