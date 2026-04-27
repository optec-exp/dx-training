import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "货物异常快速报告生成器 | OPTEC",
  description: "填表 → 自动生成中日英三语报告文本",
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
