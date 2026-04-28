import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "员工品质培训记录管理 | OPTEC",
  description: "谁完成了哪些培训课程 · 培训矩阵 · 完成率追踪",
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
