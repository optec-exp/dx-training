import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Google 文档自动生成 | OPTEC",
  description: "输入数据 → 替换模板占位符 → 导出 PDF",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
