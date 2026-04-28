import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NCR 不符合报告自动生成器 | OPTEC",
  description: "面向客户版 + 内部审计版 · 中 / 日 / 英三语同步输出",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
