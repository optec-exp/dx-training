import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "月度品质KPI仪表盘 | OPTEC",
  description: "准时率 · 异常件数 · NCR完成率",
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
