import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "费用分析 AI 工具",
  description: "从 Supabase 读取费用数据，AI 进行异常检测·趋势分析·成本削减建议",
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
