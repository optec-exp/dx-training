import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NCR 分析仪表盘 | OPTEC",
  description: "月度趋势 · 分类饼图 · 未処理列表 · 纠正完成率",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
