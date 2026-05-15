import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "配送追踪",
  description: "AWB配送状态追踪管理系统",
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
