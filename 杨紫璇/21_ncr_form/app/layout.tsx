import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NCR 快速登录表单 | OPTEC",
  description: "不符合报告一键提交系统",
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
