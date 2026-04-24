import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "纠正措施期限追踪器 | OPTEC",
  description: "NCR纠正措施期限追踪，实时显示剩余天数与状态",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
